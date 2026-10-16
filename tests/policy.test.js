import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validPetId, isLoopEnabled, isLookDirectionFrame, workRowPosition, buildStyles, fallbackName } from "../src/policy.js";
import { createPreferenceStore, STORAGE_PREFIX } from "../src/preferences.js";
import { resolveLanguage, translate, MESSAGE_KEYS } from "../src/i18n.js";

function mockView(shared = new Map(), inaccessible = false) {
  const listeners = new Map();
  const localStorage = {
    get length() { return shared.size; }, key(i) { return [...shared.keys()][i] ?? null; },
    getItem(key) { return shared.get(key) ?? null; }, setItem(key, value) { shared.set(key, value); }, removeItem(key) { shared.delete(key); },
  };
  return {
    get localStorage() { if (inaccessible) throw Error("denied"); return localStorage; },
    addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name) { listeners.delete(name); },
    storageEvent(key) { listeners.get("storage")?.({ key, newValue: shared.get(key) ?? null }); },
    listeners,
  };
}

test("supports built-in, local and account IDs, rejects placeholders/URLs/secrets", () => {
  for (const id of ["codex", "dewey", "custom:QQpet-codex", "custom:中文企鹅", "pet_example123", "future-pet"]) assert.equal(validPetId(id), true);
  for (const id of [null, "", " none ", "none", "mini", "x\ny", "https://example.test/a", "sk-secretvalue", "ghp_secretvalue"]) assert.equal(validPetId(id), false);
  assert.equal(fallbackName("custom:中文企鹅"), "中文企鹅");
});
test("v1 and v2 row geometry, unknown formats fail closed", () => {
  assert.equal(workRowPosition("800% 900%"), "87.5%");
  assert.equal(workRowPosition("800% 1100%"), "70%");
  for (const value of ["cover", "800% 1000%", "700% 900%", "auto"]) assert.equal(workRowPosition(value), null);
});
test("v2 pointer-look rows are preserved, v1 and work row are not mistaken for look poses", () => {
  assert.equal(isLookDirectionFrame("800% 1100%", "90%"), true);
  assert.equal(isLookDirectionFrame("800% 1100%", "100%"), true);
  assert.equal(isLookDirectionFrame("800% 1100%", "70%"), false);
  assert.equal(isLookDirectionFrame("800% 900%", "100%"), false);
});
test("master, per-pet override and default have the correct precedence", () => {
  const state = { master: true, defaultEnabled: true, overrides: { codex: false, dewey: true } };
  assert.equal(isLoopEnabled("codex", state), false);
  assert.equal(isLoopEnabled("dewey", state), true);
  assert.equal(isLoopEnabled("pet_new", state), true);
  assert.equal(isLoopEnabled("pet_new", { ...state, defaultEnabled: false }), false);
  assert.equal(isLoopEnabled("dewey", { ...state, master: false }), false);
});
test("generic scoped CSS loops only running, with reduced motion respected", () => {
  const css = buildStyles();
  assert.match(css, /820ms steps\(1,end\) infinite !important/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /animation: none !important/);
  assert.ok(!css.includes("QQpet") && !css.includes("pet_6ad"));
  for (const state of ["idle", "waiting", "failed", "review", "jumping", "running-left", "running-right"]) assert.ok(!css.includes(`data-codex-pet-state="${state}"`));
});
test("manifest uses the generic package ID and optional typed settings UI", async () => {
  const m = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
  assert.equal(m.name, "ct-pet-work-loop"); assert.equal(m.version, "1.1.0");
  assert.equal(m.codexTweaks.apiVersion, 3);
  assert.deepEqual(m.codexTweaks.entrypoints, { renderer: "src/index.js" });
  assert.deepEqual(m.dependencies, {}); assert.equal(m.codexTweaks.permissions, undefined);
  assert.equal(m.codexTweaks.ui.settingsSections.apiVersion, 1);
  assert.equal(m.codexTweaks.ui.settingsSections.required, false);
  assert.equal(m.codexTweaks.ui.settingsSections.items[0].id, "pet-work-loop");
  assert.equal(m.codexTweaks.ui.settingsSections.items[0].title, "Pet Work Loop");
  assert.equal(m.codexTweaks.ui.settingsSections.items[0].after, "pets");
  assert.equal(m.codexTweaks.ui.settingsSections.items[0].parent, undefined);
});
test("fresh configuration enables all supported pets without hard-coded account IDs", () => {
  const store = createPreferenceStore(mockView());
  assert.equal(store.snapshot().master, true); assert.equal(store.snapshot().defaultEnabled, true);
  assert.equal(store.listPets().length, 9);
  assert.ok(store.listPets().every(p => !p.id.startsWith("pet_")));
  store.dispose();
});
test("overrides persist and rehydrate; inheritance can be restored", () => {
  const shared = new Map(); const a = createPreferenceStore(mockView(shared));
  a.setOverride("codex", false); a.setDefault(false); a.setOverride("dewey", true); a.dispose();
  const b = createPreferenceStore(mockView(shared));
  assert.equal(isLoopEnabled("codex", b.snapshot()), false);
  assert.equal(isLoopEnabled("dewey", b.snapshot()), true);
  b.setOverride("dewey", null); assert.equal(isLoopEnabled("dewey", b.snapshot()), false);
  b.setDefault(true); assert.equal(isLoopEnabled("dewey", b.snapshot()), true);
  b.dispose();
});
test("one window discovering a pet does not clobber another window's preferences", () => {
  const shared = new Map(); const va = mockView(shared); const vb = mockView(shared);
  const a = createPreferenceStore(va); const b = createPreferenceStore(vb);
  a.setOverride("codex", false); b.rememberPet("custom:Test", "Test");
  const key = STORAGE_PREFIX + "override:codex"; vb.storageEvent(key);
  assert.equal(isLoopEnabled("codex", b.snapshot()), false);
  const c = createPreferenceStore(mockView(shared));
  assert.equal(isLoopEnabled("codex", c.snapshot()), false);
  assert.ok(c.listPets().some(p => p.id === "custom:Test"));
  a.dispose(); b.dispose(); c.dispose();
});
test("corrupt stored values and unrelated keys are ignored", () => {
  const shared = new Map([[STORAGE_PREFIX + "master", "null"], [STORAGE_PREFIX + "default", "broken"], [STORAGE_PREFIX + "override:codex", '"false"'], [STORAGE_PREFIX + "pet:custom%3Aok", '{"name":"Okay"}'], ["other-package:key", "false"]]);
  const store = createPreferenceStore(mockView(shared));
  assert.equal(isLoopEnabled("codex", store.snapshot()), true);
  assert.ok(store.listPets().some(p => p.name === "Okay")); store.dispose();
});
test("unavailable storage uses explicit session-only fallback", () => {
  const view = mockView(new Map(), true); const store = createPreferenceStore(view);
  assert.ok(store.error()); store.setMaster(false); assert.equal(store.snapshot().master, false);
  store.dispose(); store.dispose(); assert.equal(view.listeners.size, 0);
});
test("manual names are not overwritten by DOM discovery", () => {
  const store = createPreferenceStore(mockView()); store.rememberPet("pet_example", "My penguin", true);
  store.rememberPet("pet_example", "Pet mascot");
  assert.equal(store.listPets().find(p => p.id === "pet_example").name, "My penguin"); store.dispose();
});
test("storage clear and override deletion restore the default", () => {
  const shared = new Map(); const view = mockView(shared); const store = createPreferenceStore(view);
  store.setOverride("codex", false); shared.delete(STORAGE_PREFIX + "override:codex"); view.storageEvent(STORAGE_PREFIX + "override:codex");
  assert.equal(isLoopEnabled("codex", store.snapshot()), true);
  store.setMaster(false); shared.clear(); view.storageEvent(null); assert.equal(store.snapshot().master, true); store.dispose();
});
test("prototype-looking IDs do not pollute configuration objects", () => {
  const store = createPreferenceStore(mockView()); store.setOverride("constructor", false);
  assert.equal(isLoopEnabled("constructor", store.snapshot()), false);
  assert.equal(isLoopEnabled("codex", store.snapshot()), true); assert.equal({}.polluted, undefined); store.dispose();
});

test("Chinese page hints win; every other locale falls back to English", () => {
  for (const locale of ["zh", "zh-CN", "zh-TW", "zh_Hant", "ZH-hk"]) assert.equal(resolveLanguage("auto", locale, ["en"]), "zh");
  for (const locale of ["en", "en-GB", "fr-FR", "ja-JP", "de", "zhongwen"]) assert.equal(resolveLanguage("auto", locale, ["zh-CN"]), "en");
  assert.equal(resolveLanguage("auto", "", ["zh-CN", "en"]), "zh");
  assert.equal(resolveLanguage("auto", "  ", ["zh-CN"]), "zh");
  assert.equal(resolveLanguage("auto", null, ["ja", "zh-CN"]), "en");
  assert.equal(resolveLanguage("auto", "", []), "en");
  assert.equal(resolveLanguage("en", "zh-CN"), "en");
  assert.equal(resolveLanguage("zh", "en"), "zh");
});

test("all message keys have Chinese and English text and interpolate safely", () => {
  for (const key of MESSAGE_KEYS) {
    assert.notEqual(translate("en", key), key, key);
    assert.match(translate("zh", key), /[\u3400-\u9fff]/, key);
    assert.doesNotMatch(translate("en", key), /[\u3400-\u9fff]/, key);
  }
  assert.equal(translate("en", "loopLabel", { name: "<b>Pet</b>" }), "<b>Pet</b>: loop work animation");
});

test("language persists and syncs without altering playback switches", () => {
  const shared = new Map(); const va = mockView(shared); const vb = mockView(shared);
  const a = createPreferenceStore(va), b = createPreferenceStore(vb);
  a.setOverride("codex", false); a.setLanguage("en"); vb.storageEvent(STORAGE_PREFIX + "language");
  assert.equal(b.snapshot().language, "en");
  assert.equal(a.snapshot().overrides.codex, false);
  const c = createPreferenceStore(mockView(shared)); assert.equal(c.snapshot().language, "en");
  assert.throws(() => c.setLanguage("fr"));
  shared.set(STORAGE_PREFIX + "language", '"not-a-locale"');
  const d = createPreferenceStore(mockView(shared)); assert.equal(d.snapshot().language, "auto");
  a.dispose(); b.dispose(); c.dispose(); d.dispose();
});
