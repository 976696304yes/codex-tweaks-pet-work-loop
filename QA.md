# Verification — 1.1.0 / 2026-10-16

Unpublished bilingual revision of 1.1.0: package identity remains `ct-pet-work-loop`, directory `codex-tweaks-pet-work-loop`. Existing playback keys and route identity are unchanged; one validated language-preference key is added. No version tag or release has been published.

## Source and tests

- Node unit suite: 17 tests passed. Covers generic pet IDs, per-pet/master/default precedence, inheritance, persistence, corruption, unavailable storage, concurrent discovery, manual names, prototype safety, language fallback, complete bilingual dictionaries and persistent language settings.
- Syntax checks cover index.js, preferences.js, manager.js, policy.js and i18n.js.
- Chromium in-app browser: 74 HTML/JS/CSS checks passed; no failures, reduced motion was false. Two separate same-origin rendering contexts verified storage/BroadcastChannel propagation. See `tests/harness.html` for executable assertions and the rendered report.
- Verified actual CSS frame positions at 1,121,241,361,481,601,819,821,2461,4101 ms for two pet IDs after native inline position deliberately fell back to idle.
- Verified per-pet off leaves another pet on; master off/on preserves overrides; default changes preserve independent settings; reset restores inheritance; searches and manual account IDs work without source edits/recompilation.
- Verified all non-running states, v1/v2 geometry, pointer-look rows, unsupported geometry, removed identity, clones, teardown and reinjection.
- Verified automatic English/Chinese page hints, French/Japanese English fallback, manual overrides, live ARIA/status/error translation, preserved search/focus and playback switches, preference persistence and language-observer cleanup.

## Verification limits

Browser fixture uses a documented-shape settingsSections stub and local test artwork, not the actual Codex settings router. The optional settings extension, page language hints and storage origin sharing must be checked in the actual updated client after manual compilation. This report does not claim live client success for this revision. The documented settingsSections v1 contract does not expose nesting under native pets or dynamic manifest titles: a static English entry after pets is retained, with bilingual mounted content and a manual language override. No private module/route patch was added.

No package Node permissions or npm dependencies were added. Ordinary per-key localStorage preference values and BroadcastChannel snapshots are not command queues. Unknown formats fail closed. No user configuration, artwork URLs, credentials or personal account IDs are included in source.
