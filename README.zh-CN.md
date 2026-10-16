# Pet Work Loop — 宠物持续工作动画

[English](README.md) | 简体中文

让兼容的 Codex 宠物在原生 `running` 状态下一直播放工作动画，并按宠物单独开关。不改图像、模型行为或任务状态。

功能包 ID：`ct-pet-work-loop`。目录及建议仓库名：`codex-tweaks-pet-work-loop`。版本：1.1.0（未公开，包含本次双语修订）。

## 功能

- 标准 v1/v2 图集的内置、本地自定义和账户宠物，不写死个人 ID。
- 总开关、默认策略、逐宠物独立开关、“跟随默认”。关闭总开关保留独立选择。
- 搜索、页面识别、手动记录。列表**不是实时完整账户库清单**。
- 内容、无障碍标签、状态及错误提示支持中英文。自动模式优先页面 `lang` 标记，缺失时使用浏览器/系统语言；非中文统一英语。应用未准确提供语言时可手动选中文 / English，即时生效。
- 普通本机偏好独立保存，通过 storage 事件和 BroadcastChannel 同步到同源窗口。
- 保留其他状态及 v2 指针视线动作，尊重减少动态效果。六帧工作周期：前五帧各 120 ms，末帧 220 ms。
- 停用恢复原生播放，保留配置。

## 安装与设置

1. 安装 Codex Tweaks，把目录或 ZIP 导入为一个包，根目录有 `package.json`。将来真实仓库发布后可从仓库安装发布标签；目前尚未公开。
2. 旧名称安装若仍存在，先停用并移除（保留备份），避免两份同时运行。新包身份需手动开启。
3. 在 Tweaks 编译/重新注入并启用 `ct-pet-work-loop`，无需 Node 授权。
4. 打开 **设置 → Pet Work Loop**，位于个人设置组、原生宠物入口之后；设置语言及总开关、默认策略、独立开关。

Windows 默认目录：`%LOCALAPPDATA%\Codex Tweaks\Tweaks\packages\codex-tweaks-pet-work-loop`。

已文档化的 settingsSections v1 仅支持独立页，不支持原生宠物页内部子菜单；manifest 标题也是静态文字。因此导航统一为英语 **Pet Work Loop**，页面内容双语。本包不修改私有路由或导入私有模块绕过限制。见 [Tweaks UI 接口](https://github.com/codex-tweaks/codex-tweaks/blob/main/Skills/develop-codex-tweaks-package/SKILL.md#typed-ui-extensions)。

首次默认总开关和未配置宠物开启。本次双语修订保留已有开关；包 ID、路由 ID、存储前缀不变。

## 宠物发现

已文档化的 API 不枚举完整账户库。管理页预置九个已知内置 ID，再从渲染元素识别 ID/名称。未出现时先打开原生选择页（必要时滚动）或切换到该宠物，再返回；也可手动输入实际 ID 和可选名称。

历史记录保留。记录不创建、上传或删除宠物，不需要密码、API Key 或图像 URL。用户宠物名称不翻译。

## 保存、权限与安全

- 前缀保持 `codex-tweaks:pet-work-loop:v1:`，开关/记录独立键，语言使用 `language` 键。这是普通偏好，不是命令队列。
- 保存开关、宠物 ID/名称和语言，不存储或发送凭据、签名链接、图像或聊天。
- 本机应用源配置，不同步到账户或 GitHub。不同来源不保证互通，同源 iframe 测试不能代替真实浮窗验证。
- 存储失败显示本地化的会话提示。
- Renderer 读取宠物身份/状态、图集几何及标签，添加作用域 CSS、标记/变量及可选设置页。不改变原生内联位置、任务状态或交互处理器。
- 不使用 Node、npm 依赖、网络或客户端安装文件修改。
- 清理时注销页面，移除观察器/监听/样式，恢复自有 DOM 改动。恢复备份前先停用，再在 Tweaks 重新编译。
- 不要公开本机偏好、账户 ID 清单、日志或个人备份。

## 兼容性与限制

Codex Tweaks API v3，可选 settingsSections v1。标准 v1 `1536×1872` / v2 `1536×2288`，`192×208` 单元格。未知格式/身份不处理。DOM 标记不是官方稳定扩展接口，客户端升级可能需要适配。

仅对客户端实际的 `running` 生效，批准、错误、审查等高优先级状态可能中断。自动模式不读取私有应用语言设置；页面标记缺失或不准确时请手动选择。

原始循环在 Windows 经用户确认；通用管理/本地化经浏览器夹具验证。真实路由、语言标记及浮窗存储仍需在实际客户端编译后确认。不声称 macOS 实机通过。见 [QA](QA.md)。

不分发 QQ/腾讯图像或客户端提取模块，第三方非官方项目，与 OpenAI、腾讯无隶属关系。原生状态见 [OpenAI Pets 文档](https://learn.chatgpt.com/docs/pets)。

## 开发与测试

无需安装依赖：

```sh
node tests/policy.test.js
node --check src/index.js
node --check src/preferences.js
node --check src/manager.js
node --check src/i18n.js
```

在项目父目录启动本地 HTTP 服务，打开 `tests/harness.html`。测试使用符合接口形状的设置替身，不是真实路由；可选引用相邻 QQpet 图像用于观察，包内不带素材，没有图像也可执行 CSS/DOM 检查。

## 许可证与公开

尚未公开。`UNLICENSED` 表示未授予开源许可，不是 Unlicense。选择许可证并添加完整 LICENSE 后再声明开源；真实仓库建立后填 repository/homepage。不要上传本机偏好或归档安装副本。
