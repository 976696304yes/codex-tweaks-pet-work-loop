import { isLoopEnabled, validPetId } from "./policy.js";
import { pageLanguage, translate, observeLanguage } from "./i18n.js";

const PANEL = "data-codex-tweaks-pet-loop-panel";
export function mountManager(container, store, scan) {
  const doc = container.ownerDocument;
  const shell = doc.createElement("section");
  shell.setAttribute(PANEL, "");
  const style = doc.createElement("style");
  style.textContent = `
[${PANEL}] { color:var(--color-text,CanvasText); font:14px/1.55 system-ui; max-width:900px; padding:24px; }
[${PANEL}] h2 { margin:0 0 8px; font-size:24px; }
[${PANEL}] p { margin:8px 0 16px; }
[${PANEL}] .muted { opacity:.72; }
[${PANEL}] .box { border:1px solid color-mix(in srgb,currentColor 22%,transparent); border-radius:12px; padding:16px; margin:16px 0; }
[${PANEL}] .control { display:flex; align-items:center; gap:12px; padding:8px 0; cursor:pointer; }
[${PANEL}] input[type=checkbox] { width:18px; height:18px; accent-color:#287c9d; flex:none; }
[${PANEL}] input[type=text], [${PANEL}] input[type=search] { padding:9px 12px; border:1px solid color-mix(in srgb,currentColor 28%,transparent); border-radius:8px; color:inherit; background:var(--color-background-elevated,Canvas); min-width:0; width:100%; box-sizing:border-box; }
[${PANEL}] button, [${PANEL}] select { padding:7px 12px; border:1px solid color-mix(in srgb,currentColor 28%,transparent); border-radius:8px; color:inherit; background:var(--color-background-elevated,Canvas); cursor:pointer; }
[${PANEL}] button:disabled { opacity:.5; cursor:default; }
[${PANEL}] button:focus-visible, [${PANEL}] input:focus-visible, [${PANEL}] select:focus-visible { outline:2px solid #287c9d; outline-offset:3px; }
[${PANEL}] .toolbar { display:flex; align-items:center; gap:12px; }
[${PANEL}] .toolbar button { flex-shrink:0; white-space:nowrap; }
[${PANEL}] .pet-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:12px; align-items:center; padding:14px 0; border-bottom:1px solid color-mix(in srgb,currentColor 15%,transparent); }
[${PANEL}] .pet-id { overflow-wrap:anywhere; font-size:12px; opacity:.65; }
[${PANEL}] .pet-name { font-weight:600; }
[${PANEL}] .badge { font-size:12px; opacity:.72; }
[${PANEL}] [hidden] { display:none !important; }
[${PANEL}] form { display:grid; gap:12px; }
[${PANEL}] .notice { color:var(--color-text-warning,#aa5200); }
@media(max-width:600px) { [${PANEL}] { padding:12px; } [${PANEL}] .pet-row { grid-template-columns:minmax(0,1fr) auto; } [${PANEL}] .pet-row button { grid-column:1/-1; justify-self:start; } }
`;
  shell.append(style);
  function el(tag, text = "", className = "") {
    const node = doc.createElement(tag); node.textContent = text; if (className) node.className = className; return node;
  }
  const bindings = [];
  let language = pageLanguage(doc, store);
  const t = (key, values) => translate(language, key, values);
  function bind(node, key, attribute = null) {
    bindings.push(() => { if (attribute) node.setAttribute(attribute, t(key)); else node.textContent = t(key); });
    return node;
  }
  const text = (tag, key, className = "") => bind(el(tag, "", className), key);
  shell.append(text("h2", "title"), text("p", "intro", "muted"));
  const languageLabel = el("label", "", "control");
  const languageSelect = doc.createElement("select");
  bind(languageSelect, "language", "aria-label");
  const auto = text("option", "auto"); auto.value = "auto";
  const chinese = el("option", "中文"); chinese.value = "zh";
  const english = el("option", "English"); english.value = "en";
  languageSelect.append(auto, chinese, english);
  languageLabel.append(text("span", "language"), languageSelect); shell.append(languageLabel);
  languageSelect.addEventListener("change", () => store.setLanguage(languageSelect.value));
  const preferences = el("div", "", "box");
  function toggle(key) {
    const label = el("label", "", "control");
    const input = doc.createElement("input"); input.type = "checkbox"; input.setAttribute("role", "switch");
    bind(input, key, "aria-label"); const caption = text("span", key); label.append(input, caption); return { label, input, caption };
  }
  const master = toggle("master");
  const defaults = toggle("defaults");
  preferences.append(master.label, defaults.label);
  shell.append(preferences);
  master.input.addEventListener("change", () => store.setMaster(master.input.checked));
  defaults.input.addEventListener("change", () => store.setDefault(defaults.input.checked));
  const notice = el("p", "", "notice"); notice.setAttribute("role", "status"); shell.append(notice);
  shell.append(text("p", "discovery", "muted"));
  const toolbar = el("div", "", "toolbar");
  const search = doc.createElement("input"); search.type = "search"; bind(search, "searchPlaceholder", "placeholder"); bind(search, "search", "aria-label");
  const rescan = text("button", "rescan"); rescan.type = "button";
  toolbar.append(search, rescan); shell.append(toolbar);
  const summary = el("p", "", "muted"); summary.setAttribute("role", "status"); shell.append(summary);
  const list = el("div"); list.setAttribute("role", "list"); bind(list, "list", "aria-label"); shell.append(list);
  const empty = text("p", "empty", "muted"); list.append(empty);
  const rows = new Map();
  let disposed = false;
  let resultKey = "";

  function render() {
    if (disposed) return;
    language = pageLanguage(doc, store);
    shell.lang = language === "zh" ? "zh-CN" : "en";
    for (const update of bindings) update();
    const state = store.snapshot();
    languageSelect.value = state.language;
    master.input.checked = state.master;
    defaults.input.checked = state.defaultEnabled;
    notice.textContent = store.error() ? t(store.error()) : ""; notice.hidden = !store.error();
    result.textContent = resultKey ? t(resultKey) : "";
    const query = search.value.trim().toLocaleLowerCase();
    const pets = store.listPets();
    let shown = 0;
    for (const pet of pets) {
      let row = rows.get(pet.id);
      if (!row) {
        const element = el("div", "", "pet-row"); element.setAttribute("role", "listitem"); element.setAttribute("data-loop-pet-row", pet.id);
        const details = el("div");
        const name = el("div", "", "pet-name"); const id = el("div", pet.id, "pet-id"); const badge = el("div", "", "badge");
        details.append(name, id, badge);
        const control = toggle("loop"); const reset = text("button", "reset"); reset.type = "button";
        control.input.addEventListener("change", () => store.setOverride(pet.id, control.input.checked));
        reset.addEventListener("click", () => store.setOverride(pet.id, null));
        element.append(details, control.label, reset);
        row = { element, name, badge, input: control.input, reset }; rows.set(pet.id, row); list.append(element);
      }
      row.name.textContent = pet.name;
      row.input.setAttribute("aria-label", t("loopLabel", { name: pet.name }));
      row.reset.setAttribute("aria-label", t("resetLabel", { name: pet.name }));
      // New rows have just added bindings; initialize their visible captions now.
      row.input.nextSibling.textContent = t("loop"); row.reset.textContent = t("reset");
      row.input.checked = Object.hasOwn(state.overrides, pet.id) ? state.overrides[pet.id] : state.defaultEnabled;
      row.input.disabled = !state.master;
      row.reset.disabled = !Object.hasOwn(state.overrides, pet.id);
      row.badge.textContent = `${t(pet.source)} · ${t(Object.hasOwn(state.overrides, pet.id) ? "independent" : "inherited")}${!state.master ? " · " + t("masterOff") : ""}`;
      row.element.hidden = !`${pet.name} ${pet.id}`.toLocaleLowerCase().includes(query);
      if (!row.element.hidden) shown++;
    }
    const enabled = pets.filter(pet => isLoopEnabled(pet.id, state)).length;
    summary.textContent = t("summary", { shown, total: pets.length, enabled });
    empty.hidden = shown > 0;
  }
  search.addEventListener("input", render);
  rescan.addEventListener("click", () => { scan(); render(); });

  const formBox = el("div", "", "box");
  formBox.append(text("h3", "manualTitle"), text("p", "manualHelp", "muted"));
  const form = doc.createElement("form");
  function field(key, max) {
    const label = el("label"); const input = doc.createElement("input"); input.type = "text"; input.maxLength = max; bind(input, key, "aria-label"); label.append(text("span", key), input); return { label, input };
  }
  const idField = field("id", 200); idField.input.required = true; bind(idField.input, "idPlaceholder", "placeholder");
  const nameField = field("name", 120);
  const add = text("button", "add"); add.type = "submit";
  const result = el("p"); result.setAttribute("role", "status");
  form.append(idField.label, nameField.label, add, result);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const id = idField.input.value.trim();
    if (!validPetId(id)) { resultKey = "invalid"; render(); return; }
    if (!store.rememberPet(id, nameField.input.value, true)) { resultKey = "limit"; render(); return; }
    resultKey = "saved";
    idField.input.value = ""; nameField.input.value = ""; render();
  });
  formBox.append(form); shell.append(formBox);
  shell.append(text("p", "footer", "muted"));
  container.append(shell);
  const unsubscribe = store.subscribe(render);
  const stopLanguage = observeLanguage(doc, render);
  render();
  return () => { if (disposed) return; disposed = true; unsubscribe(); stopLanguage(); bindings.length = 0; rows.clear(); shell.remove(); };
}
