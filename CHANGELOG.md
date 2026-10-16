# 更新记录

## 未发布修订 / Unreleased revision

- 中英文 README 与设置界面；自动检测页面语言，缺失时使用系统/浏览器语言，非中文回退英语，并支持手动覆盖。状态、错误及无障碍标签同步翻译。
- English/Chinese READMEs and settings, automatic page/system hints, English fallback for non-Chinese locales and persistent manual language overrides. Statuses, errors and accessibility labels are localized.
- 设置入口固定为英语 `Pet Work Loop`，仍在原生宠物入口后。已文档化 settingsSections v1 不支持原生子菜单或动态标题，不添加私有路由补丁。
- Navigation stays `Pet Work Loop` after native pets: documented settingsSections v1 does not expose nested native menus or dynamic titles. No private routing patch is added.
- 保留原 ID 和配置键 / Existing identity and preference keys are preserved. No artwork or playback policy changes.

## 1.1.0

- 发布前统一名称：目录/仓库 `codex-tweaks-pet-work-loop`，包 ID `ct-pet-work-loop`。旧安装归档；配置存储前缀和设置页标识不变。
- 从 QQpet 专用扩展为所有标准 v1/v2 Pet，移除个人账户 ID。
- 新增 API v3 可选设置页“Pet 工作动画”，含总开关、默认策略、逐宠物开关、恢复继承、搜索和手动管理记录。
- 预置已知内置条目，自动发现页面显示过的自定义宠物；明确说明不是实时完整账户库枚举。
- 持久化普通本机偏好，使用独立存储键及同源浏览器事件同步，避免跨窗口覆盖不同开关。
- 保留其他状态与 v2 指针视线互动。补齐身份移除、克隆节点、重新挂载及设置页清理。
- 无 Node、新依赖、网络或图像修改。

## 1.0.0

- 指定 QQpet 工作状态持续循环；保留其他动作，可关闭撤销。
