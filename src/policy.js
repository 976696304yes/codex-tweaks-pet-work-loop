export const PET_SELECTOR = "[data-codex-pet-id]";
export const MARKER = "data-codex-tweaks-pet-work-loop";
export const ROW_VARIABLE = "--ct-pet-work-row";
export const ANIMATION_NAME = "ct-pet-work-loop-v2";
export const BUILTIN_PETS = Object.freeze([
  ["codex", "Codex"], ["dewey", "Dewey"], ["fireball", "Fireball"],
  ["hoots", "Hoots"], ["rocky", "Rocky"], ["seedy", "Seedy"],
  ["stacky", "Stacky"], ["bsod", "BSOD"], ["null-signal", "Null Signal"],
]);

export function validPetId(value) {
  return typeof value === "string" && value === value.trim() && value.length > 0
    && value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value)
    && !["none", "mini"].includes(value) && !/^(sk-|ghp_|github_pat_)/.test(value)
    && /^(?:custom:.+|pet_[A-Za-z0-9_-]+|[A-Za-z0-9][A-Za-z0-9._-]*)$/u.test(value);
}

export function fallbackName(id) {
  return BUILTIN_PETS.find(pet => pet[0] === id)?.[1]
    || (id.startsWith("custom:") ? id.slice(7) : id);
}

export function isLoopEnabled(id, preferences) {
  if (!validPetId(id) || !preferences.master) return false;
  return Object.hasOwn(preferences.overrides, id)
    ? preferences.overrides[id] === true : preferences.defaultEnabled;
}

export function workRowPosition(backgroundSize) {
  const match = /^800(?:\.0+)?%\s+(900|1100)(?:\.0+)?%$/.exec(backgroundSize.trim());
  return match ? `${(7 / (Number(match[1]) / 100 - 1)) * 100}%` : null;
}

export function isLookDirectionFrame(backgroundSize, positionY) {
  // v2's last two rows are pointer-look poses, not the work animation.
  return /^800(?:\.0+)?%\s+1100(?:\.0+)?%$/.test(backgroundSize.trim())
    && /^\d+(?:\.\d+)?%$/.test(positionY) && parseFloat(positionY) >= 90;
}

export function buildStyles() {
  const selector = `[data-codex-pet-id][data-codex-pet-state="running"][${MARKER}="on"]`;
  const keys = [0, 120, 240, 360, 480, 600].map((time, frame) =>
    `${time / 820 * 100}% { background-position: ${frame / 7 * 100}% var(${ROW_VARIABLE}); }`,
  ).join("\n");
  return `${selector} { animation: ${ANIMATION_NAME} 820ms steps(1,end) infinite !important; }
@keyframes ${ANIMATION_NAME} {
${keys}
100% { background-position: ${5 / 7 * 100}% var(${ROW_VARIABLE}); }
}
@media (prefers-reduced-motion: reduce) { ${selector} { animation: none !important; } }`;
}
