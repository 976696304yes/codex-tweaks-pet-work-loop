import { BUILTIN_PETS, fallbackName, validPetId } from "./policy.js";

export const STORAGE_PREFIX = "codex-tweaks:pet-work-loop:v1:";
export const SETTINGS_ID = "pet-work-loop";

// Ordinary preference values, not a localStorage command queue or hidden bridge.
// Each field has its own key so discovery in another window cannot overwrite switches.
export function createPreferenceStore(view) {
  const values = new Map();
  const listeners = new Set();
  let disposed = false;
  let error = null;
  let storage = null;
  let channel = null;
  try { storage = view.localStorage; }
  catch { error = "storageUnavailable"; }

  function decode(key, raw) {
    if (typeof key !== "string" || !key.startsWith(STORAGE_PREFIX)) return null;
    const part = key.slice(STORAGE_PREFIX.length);
    if (part === "language") {
      if (raw === null) return { key: part, value: null };
      try { const value = JSON.parse(raw); return ["auto", "zh", "en"].includes(value) ? { key: part, value } : null; }
      catch { return null; }
    }
    if (["master", "default"].includes(part)) {
      if (raw === null) return { key: part, value: null };
      try { const value = JSON.parse(raw); return typeof value === "boolean" ? { key: part, value } : null; }
      catch { return null; }
    }
    const match = /^(override|pet):(.*)$/.exec(part);
    if (!match) return null;
    let id;
    try { id = decodeURIComponent(match[2]); } catch { return null; }
    if (!validPetId(id)) return null;
    if (raw === null) return { key: part, value: null };
    try {
      const value = JSON.parse(raw);
      if (match[1] === "override") return typeof value === "boolean" ? { key: part, value } : null;
      if (!value || typeof value.name !== "string") return null;
      return { key: part, value: { name: value.name.slice(0, 120), manual: value.manual === true } };
    } catch { return null; }
  }

  function apply(key, raw) {
    const parsed = decode(key, raw);
    if (!parsed) return false;
    const old = values.get(parsed.key);
    if (JSON.stringify(old ?? null) === JSON.stringify(parsed.value)) return false;
    if (parsed.value === null) values.delete(parsed.key);
    else values.set(parsed.key, parsed.value);
    return true;
  }

  if (storage) {
    try {
      for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index);
        if (key?.startsWith(STORAGE_PREFIX)) apply(key, storage.getItem(key));
      }
    } catch { error = "storageRead"; }
  }

  function snapshot() {
    const overrides = Object.create(null);
    for (const [key, value] of values) {
      if (key.startsWith("override:")) overrides[decodeURIComponent(key.slice(9))] = value;
    }
    return { master: values.get("master") ?? true, defaultEnabled: values.get("default") ?? true, language: values.get("language") ?? "auto", overrides };
  }

  function emit() { if (!disposed) for (const listener of [...listeners]) listener(); }

  function receive(key, raw) {
    if (disposed || !decode(key, raw)) return;
    // Read the latest shared value rather than replaying a stale storage event.
    if (storage) { try { raw = storage.getItem(key); } catch { /* session fallback */ } }
    if (apply(key, raw)) emit();
  }
  function onStorage(event) {
    if (event.key === null) {
      if (storage) {
        values.clear();
        try {
          for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) apply(key, storage.getItem(key));
          }
        } catch { error = "storageSync"; }
        emit();
      }
    } else receive(event.key, event.newValue);
  }
  view.addEventListener("storage", onStorage);
  try {
    if (view.BroadcastChannel) {
      channel = new view.BroadcastChannel(STORAGE_PREFIX);
      channel.onmessage = event => {
        const data = event.data;
        if (data && typeof data.key === "string" && (data.raw === null || typeof data.raw === "string")) receive(data.key, data.raw);
      };
    }
  } catch { /* storage events remain available */ }

  function write(part, value) {
    if (disposed) return;
    const key = STORAGE_PREFIX + part;
    const raw = value === null ? null : JSON.stringify(value);
    if (!apply(key, raw)) return;
    if (storage) {
      try {
        if (raw === null) storage.removeItem(key); else storage.setItem(key, raw);
      } catch { error = "storageWrite"; }
    }
    try { channel?.postMessage({ key, raw }); } catch { /* local view still updates */ }
    emit();
  }

  function listPets() {
    const pets = new Map(BUILTIN_PETS.map(([id, name]) => [id, { id, name, source: "builtin" }]));
    for (const [key, value] of values) {
      if (key.startsWith("pet:")) {
        const id = decodeURIComponent(key.slice(4));
        pets.set(id, { id, name: value.name || fallbackName(id), source: value.manual ? "manual" : "observed" });
      } else if (key.startsWith("override:")) {
        const id = decodeURIComponent(key.slice(9));
        if (!pets.has(id)) pets.set(id, { id, name: fallbackName(id), source: "configured" });
      }
    }
    return [...pets.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    snapshot, listPets, error: () => error,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    setMaster(value) { write("master", !!value); },
    setDefault(value) { write("default", !!value); },
    setLanguage(value) {
      if (!["auto", "zh", "en"].includes(value)) throw Error("Invalid language preference.");
      write("language", value);
    },
    setOverride(id, value) {
      if (!validPetId(id)) throw Error("Invalid pet ID.");
      write("override:" + encodeURIComponent(id), value === null ? null : !!value);
    },
    rememberPet(id, name = "", manual = false) {
      if (!validPetId(id)) return false;
      const key = "pet:" + encodeURIComponent(id);
      const old = values.get(key);
      if (old?.manual && !manual) return false;
      if (!old && listPets().length >= 512) return false;
      // No artwork URL, upload URL or credentials are stored.
      const clean = String(name || fallbackName(id)).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 120);
      if (!manual && BUILTIN_PETS.some(pet => pet[0] === id) && !old) return false;
      write(key, { name: clean || fallbackName(id), manual });
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      view.removeEventListener("storage", onStorage);
      channel?.close();
      listeners.clear();
    },
  };
}
