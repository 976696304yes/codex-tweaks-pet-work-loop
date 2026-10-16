import { PET_SELECTOR, MARKER, ROW_VARIABLE, fallbackName, isLoopEnabled, isLookDirectionFrame, workRowPosition, buildStyles, validPetId } from "./policy.js";
import { createPreferenceStore, SETTINGS_ID } from "./preferences.js";
import { mountManager } from "./manager.js";

export function activate({ root, onCleanup, ui }) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  if (!view?.MutationObserver) return;
  const store = createPreferenceStore(view);
  const style = doc.createElement("style");
  style.setAttribute(MARKER, "stylesheet");
  style.textContent = buildStyles();
  doc.head.append(style);
  const touched = new Map();
  const managers = new Set();
  let disposed = false;

  function restore(element) {
    const saved = touched.get(element);
    if (!saved) return;
    if (saved.marker === null) element.removeAttribute(MARKER); else element.setAttribute(MARKER, saved.marker);
    if (saved.row === "") element.style.removeProperty(ROW_VARIABLE); else element.style.setProperty(ROW_VARIABLE, saved.row, saved.priority);
    touched.delete(element);
  }

  function sync(element) {
    const id = element?.getAttribute?.("data-codex-pet-id");
    if (!validPetId(id)) { restore(element); return; }
    const size = element.style.backgroundSize || view.getComputedStyle(element).backgroundSize;
    const position = isLoopEnabled(id, store.snapshot()) && !isLookDirectionFrame(size, element.style.backgroundPositionY)
      ? workRowPosition(size) : null;
    if (!element.isConnected || position === null) { restore(element); return; }
    if (!touched.has(element)) {
      const inherited = element.getAttribute(MARKER) === "on";
      touched.set(element, {
        marker: inherited ? null : element.getAttribute(MARKER),
        row: inherited ? "" : element.style.getPropertyValue(ROW_VARIABLE),
        priority: inherited ? "" : element.style.getPropertyPriority(ROW_VARIABLE),
      });
    }
    if (element.getAttribute(MARKER) !== "on") element.setAttribute(MARKER, "on");
    if (element.style.getPropertyValue(ROW_VARIABLE) !== position) element.style.setProperty(ROW_VARIABLE, position);
  }

  function discover(element) {
    const id = element.getAttribute("data-codex-pet-id");
    if (!validPetId(id)) return;
    const labelled = element.closest('[data-testid="avatar-mascot-button"]')?.getAttribute("aria-label");
    const card = element.closest("button");
    const name = labelled || card?.getAttribute("aria-label") || card?.textContent?.trim().slice(0, 120) || fallbackName(id);
    store.rememberPet(id, name);
  }

  function scan(node, remember = true) {
    if (node?.matches?.(PET_SELECTOR)) { if (remember) discover(node); sync(node); }
    node?.querySelectorAll?.(PET_SELECTOR).forEach(element => { if (remember) discover(element); sync(element); });
  }
  const unsubscribe = store.subscribe(() => scan(doc.documentElement, false));
  const observer = new view.MutationObserver(records => {
    if (disposed) return;
    for (const record of records) {
      if (record.type === "attributes" && (record.target.hasAttribute("data-codex-pet-id") || touched.has(record.target))) {
        if (record.attributeName === "data-codex-pet-id") discover(record.target);
        sync(record.target);
      } else if (record.type === "childList") for (const added of record.addedNodes) scan(added);
    }
    for (const element of touched.keys()) if (!element.isConnected) restore(element);
  });
  observer.observe(doc.documentElement, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ["data-codex-pet-id", "data-codex-pet-state", "style"],
  });
  scan(doc.documentElement);

  let registration = null;
  try {
    registration = ui?.settingsSections?.register({
      id: SETTINGS_ID,
      mount(container) {
        const unmount = mountManager(container, store, () => scan(doc.documentElement));
        managers.add(unmount);
        return () => { unmount(); managers.delete(unmount); };
      },
    });
  } catch (error) {
    // Optional settings adapter may be absent in the floating renderer.
    view.console?.warn("[Pet Work Loop] Settings registration failed; saved playback preferences still apply.", error);
  }

  function cleanup() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    try { registration?.unregister?.(); } catch { /* host teardown must not block our own cleanup */ }
    for (const unmount of managers) { try { unmount(); } catch { /* continue cleaning other mounts */ } }
    managers.clear();
    unsubscribe(); store.dispose();
    for (const element of touched.keys()) restore(element);
    style.remove();
  }
  onCleanup(cleanup);
  return cleanup;
}
