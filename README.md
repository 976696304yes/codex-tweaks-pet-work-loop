# Pet Work Loop

English | [简体中文](README.zh-CN.md)

Continuous work animation for compatible Codex pets, with individual switches. Only native `running` playback changes—not artwork, models or task state.

Package ID: `ct-pet-work-loop`. Directory / suggested repository: `codex-tweaks-pet-work-loop`. Version: 1.1.0 (unpublished, including this bilingual revision).

## Features

- Built-in, local custom and account pets using standard v1/v2 atlases; no hard-coded personal IDs.
- Master switch, default policy, per-pet overrides and restore inheritance. Turning the master off preserves individual choices.
- Search, page discovery and manual records. This is **not** a live account-library inventory.
- Chinese/English content, accessibility labels, statuses and errors. Automatic mode uses the page's `lang` hint, then browser/system language when absent. Every non-Chinese locale uses English. Manual 中文 / English choices work immediately if the app does not expose its language accurately.
- Local preference persistence and same-origin window synchronization using storage events and BroadcastChannel.
- Other states and v2 pointer-look poses remain intact; reduced motion is respected. Six-frame work cycle: five × 120 ms, then 220 ms.
- Disable to restore native playback; preferences remain saved.

## Install and configure

1. Install Codex Tweaks. Import this directory or ZIP as one package with `package.json` at its root. Once a real repository/release exists, install that repository's released tag. Nothing has been published yet.
2. Disable/remove an older-named installation first (keep a backup) to avoid duplicate copies. New package identities require manual enabling.
3. Compile/reinject and enable `ct-pet-work-loop` in Tweaks. No Node authorization is needed.
4. Open **Settings → Pet Work Loop**, in the personal group after the native pets entry. Configure language and master/default/per-pet switches.

Windows default: `%LOCALAPPDATA%\Codex Tweaks\Tweaks\packages\codex-tweaks-pet-work-loop`.

The documented settingsSections v1 API provides independent pages, not submenus inside the native pets page. The manifest title is static, so navigation stays **Pet Work Loop** in every language; the mounted content is localized. No private routes/modules are patched. See the [Tweaks UI contract](https://github.com/codex-tweaks/codex-tweaks/blob/main/Skills/develop-codex-tweaks-package/SKILL.md#typed-ui-extensions).

Fresh installs enable the master and all unconfigured compatible pets. Existing switches survive this bilingual revision; the package ID, route ID and storage prefix are unchanged.

## Pet discovery

There is no documented API to enumerate the full account library. The manager starts with nine known built-in IDs, then observes IDs/names in rendered pet elements. Open the native picker (scroll if needed) or select a missing pet, then return here. Alternatively enter its actual ID and optional name manually.

Historical records remain. A record does not create, upload or delete a pet and needs no password, API key or artwork URL. User-provided pet names are not translated.

## Storage, permissions and safety

- Unchanged prefix: `codex-tweaks:pet-work-loop:v1:`. Switches/records use independent keys; language uses `language`. These are ordinary preferences, not a command queue.
- Stored data: switches, pet IDs/names and language choice. No credentials, signed URLs, artwork or chat content are stored/sent.
- Local device/app-origin settings, not account or GitHub synchronization. Separate origins may not share them. Same-origin iframe tests do not prove real floating-window sharing.
- Storage failures show localized session-only warnings.
- Renderer reads pet identity/state, atlas geometry and pet labels; adds scoped CSS, markers/variables and an optional settings page. Native inline positions, task state and interaction handlers are untouched.
- Node backend, npm dependencies, network requests and client installation-file changes: **none**.
- Cleanup unregisters the page, removes observers/listeners/styles and restores owned DOM changes. Disable before restoring an installation backup, then recompile in Tweaks.
- Never publish local preferences, account ID lists, logs or personal backups.

## Compatibility and limits

Codex Tweaks API v3; optional settingsSections v1. Standard v1 `1536×1872` / v2 `1536×2288`, `192×208` cells. Unknown geometry or identity is left unchanged. Pet DOM markers are not an official stable extension API; client updates may need adaptation.

Only the client's actual `running` state loops. Approval, errors, review and other higher-priority states can interrupt it. Automatic localization cannot read a private app language setting: use the manual choice if the page hint is missing/inaccurate.

The original loop was user-confirmed on Windows. Generalized management/localization are verified in browser fixtures; native routing, language hints and floating-window storage still need actual-client confirmation after compilation. No macOS live test is claimed. See [QA](QA.md).

No QQ/Tencent artwork or extracted client modules are distributed. This is unofficial and not affiliated with OpenAI or Tencent. [OpenAI Pets documentation](https://learn.chatgpt.com/docs/pets) describes native states.

## Development

No dependency installation needed:

```sh
node tests/policy.test.js
node --check src/index.js
node --check src/preferences.js
node --check src/manager.js
node --check src/i18n.js
```

Serve the project's parent over local HTTP and open `tests/harness.html`. It uses a documented-shape settings stub, not the real router. An optional sibling QQpet checkout supplies test artwork; none is included here, and CSS/DOM checks run without it.

## License and publication

Unpublished. `UNLICENSED` means no open-source permission is granted, not the Unlicense. Choose a license and add its complete LICENSE before declaring the code open source. Add repository/homepage metadata only after a real repository exists. Do not upload local preferences or archived installations.
