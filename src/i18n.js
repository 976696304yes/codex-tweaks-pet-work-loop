// No private app modules: use an explicit choice, the page's language hint,
// then browser/system languages. Every non-Chinese locale falls back to English.
export function resolveLanguage(choice, pageLanguage, browserLanguages = []) {
  if (choice === "zh" || choice === "en") return choice;
  const locale = String(pageLanguage || "").trim() || String(browserLanguages.find(Boolean) || "en").trim();
  return /^zh(?:[-_]|$)/i.test(locale) ? "zh" : "en";
}

export function pageLanguage(doc, store) {
  const nav = doc.defaultView.navigator;
  return resolveLanguage(store.snapshot().language, doc.documentElement.lang,
    nav.languages?.length ? nav.languages : [nav.language]);
}

const messages = {
  title: ["Pet Work Loop", "宠物工作动画"],
  intro: ["Manage continuous work animation per pet. Preferences stay on this device and sync to same-origin pet windows. Only running playback changes, never task state.", "按宠物设置持续工作循环，设置保存在本机并同步到同源宠物浮窗。仅改变 running 的播放，不改变任务状态。"],
  language: ["Interface language", "界面语言"],
  auto: ["Automatic (page / system)", "自动（页面 / 系统）"],
  master: ["Enable continuous work animation (master switch)", "启用持续工作动画（总开关）"],
  defaults: ["Enable by default for pets without an override", "没有独立设置的宠物默认启用"],
  discovery: ["These are known built-ins and custom pets observed on the page, not a live account library. To discover another pet, open the native pet picker (scroll if needed) or select that pet, then return here.", "下方是已知内置宠物及页面中识别过的自定义宠物，不是实时账户库清单。请先打开系统宠物选择页（必要时滚动列表）或切换到该宠物，再返回这里。"],
  searchPlaceholder: ["Search pet name or ID", "搜索宠物名称或 ID"],
  search: ["Search pets", "搜索宠物"],
  rescan: ["Rescan page", "重新扫描页面"],
  list: ["Pet loop preferences", "宠物循环设置"],
  empty: ["No matching pets.", "没有匹配的宠物。"],
  loop: ["Loop", "循环"],
  reset: ["Use default", "跟随默认"],
  loopLabel: ["{name}: loop work animation", "{name} 循环工作动画"],
  resetLabel: ["{name}: use default preference", "{name} 跟随默认设置"],
  independent: ["Override", "独立设置"],
  inherited: ["Use default", "跟随默认"],
  masterOff: ["Master switch off", "总开关已关闭"],
  builtin: ["Built-in (known)", "内置（已知）"],
  manual: ["Manually added", "手动添加"],
  observed: ["Observed on page", "页面已识别"],
  configured: ["Existing override", "已有独立设置"],
  summary: ["Showing {shown} / {total} pets; {enabled} enabled by the current policy. Preferences are local, not synced with GitHub packages or account pets.", "显示 {shown} / {total} 只；当前策略启用 {enabled} 只。设置保存于本机，不随 GitHub 包或账户宠物同步。"],
  manualTitle: ["Add or update a pet record", "手动添加或更新宠物记录"],
  manualHelp: ["If a pet is missing, enter its ID. No password, API key or artwork URL is needed. This only adds a management record; it does not create or delete a pet.", "没有识别到时可填写宠物 ID；不需要密码、API Key 或图像下载链接。这只增加管理记录，不创建或删除宠物。"],
  id: ["Pet ID", "宠物 ID"],
  idPlaceholder: ["For example custom:MyPet or your own account pet ID", "例如 custom:MyPet 或自己的账户宠物 ID"],
  name: ["Display name (optional)", "显示名称（可选）"],
  add: ["Add / update record", "添加 / 更新记录"],
  invalid: ["Invalid ID: enter the actual pet ID, not a download link or credential.", "ID 无效：请填写实际宠物 ID，而不是下载链接或凭据。"],
  limit: ["Cannot add: the record limit has been reached.", "无法添加：记录数量已达到上限。"],
  saved: ["Record saved. When this pet appears, its playback will follow this preference.", "已保存管理记录；该宠物显示时会按这里的开关播放。"],
  footer: ["Standard v1/v2 atlases only; unknown formats are left unchanged. Reduced motion is respected. Disable the package to restore native animation; preferences remain saved.", "支持标准 v1/v2 图集；其他格式不修改。尊重减少动态效果设置。关闭功能包即可恢复原生动画，保存的开关会保留。"],
  storageUnavailable: ["Local storage is unavailable: preferences last only for this session.", "本机存储不可用：设置仅在当前会话有效。"],
  storageRead: ["Cannot read local preferences: using session-only settings.", "读取本机设置失败：本次使用会话内配置。"],
  storageSync: ["Cannot sync local preferences.", "同步本机设置失败。"],
  storageWrite: ["Cannot save (storage disabled or full): changes last only for this session.", "保存失败（存储被禁用或已满）：修改仅在当前会话有效。"],
};

export const MESSAGE_KEYS = Object.freeze(Object.keys(messages));
export function translate(language, key, values = {}) {
  const text = messages[key]?.[language === "zh" ? 1 : 0] || key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

export function observeLanguage(doc, notify) {
  const view = doc.defaultView;
  const observer = new view.MutationObserver(notify);
  observer.observe(doc.documentElement, { attributes: true, attributeFilter: ["lang"] });
  view.addEventListener("languagechange", notify);
  return () => { observer.disconnect(); view.removeEventListener("languagechange", notify); };
}
