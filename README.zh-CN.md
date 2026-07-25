# Pi Web Secure

[English](./README.md) · [上游项目：agegr/pi-web](https://github.com/agegr/pi-web)

这是基于 [`agegr/pi-web`](https://github.com/agegr/pi-web) 修改增强的 Pi Web 分支。Pi Web 是 [Pi coding agent](https://github.com/badlogic/pi-mono) 的浏览器界面；本项目在保留上游核心体验的基础上，增加了适合局域网、反向代理和手机 PWA 使用的安全与工作流能力。

![Pi Web 展示 Pi 会话、结构化消息、工具调用和项目导航](./docs/screenshot2.png)

本项目直接读取运行 Pi 的那台机器上的会话、配置、模型、Skill、插件和项目文件，因此它应当运行在 Pi 环境所在的服务器或工作站上。浏览器只是远程操作界面，不会把 Pi 运行环境复制到手机或其他客户端。

> **重要说明：** 本仓库是增强版源代码。`npx @agegr/pi-web` 安装的是以原项目名称发布的 npm 包，不会自动变成本仓库的增强版本。想使用本增强版，请 clone 本仓库后本地构建，或者将本源码发布为你自己的 npm 包。

## 本 Fork 相对上游修改了什么

当前增强版基于上游 `agegr/pi-web` v0.8.0，并合入截至上游提交 `0d1d0d1` 的后续修复。以下内容专门描述本 fork 在该上游基线之上继续维护的功能。

### 1. 访问安全与私网部署

- 增加可选的单密码 Web 登录，使用 `PI_WEB_AUTH_PASSWORD` 配置。
- 页面、API、SSE Agent 事件流、文件预览和文件下载统一受到认证保护。
- 使用签名、HTTP-only、SameSite Cookie 保存登录状态，默认有效期为 30 天。
- 修改密码并重启服务后，旧登录状态自动失效。
- 对状态修改请求增加跨站请求保护。
- 增加 `X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy` 等安全响应头。
- 认证后的页面和 API 使用私有、禁止缓存策略，降低会话和工作区数据被缓存的风险。
- 不设置 `PI_WEB_AUTH_PASSWORD` 时仍可保持无认证模式，方便本机开发和与上游行为兼容。

### 2. PWA 与手机使用

- 支持安装为 Progressive Web App，包含 manifest、应用图标、maskable 图标和 Apple touch icon。
- 支持手机刘海屏和底部安全区域。
- 增加适合手机屏幕的登录页和侧栏行为。
- Service Worker 不缓存会话、API 响应和项目文件，避免离线状态下显示过期或敏感的工作区数据。
- 正式安装 PWA 通常需要 HTTPS；现代浏览器一般把 `localhost` 视为安全开发来源。

### 3. 聊天文件工作流

- 在上游 Explorer 上传能力的基础上，把普通文件上传扩展到聊天拖拽区域。
- 可以把普通文件直接拖入聊天区，并上传到当前工作目录。
- 图片继续作为模型视觉附件；Word、Excel、PDF、ZIP 和其他普通文件作为工作区文件上传。
- 混合拖入时自动把图片和普通文件分开处理。
- Explorer 和聊天上传共用同一套上传控制器，包括预检查、进度、错误和结果摘要。
- 保留上游的同名文件处理：替换、跳过或取消。
- 聊天上传成功后自动刷新 Explorer。
- 上传成功后自动在输入框插入 `@文件名` 引用。
- 如果上传过程中切换工作目录，旧请求结果不会污染新会话。
- 保留服务端对危险文件名、路径穿越、冲突策略和允许根目录的校验。

### 4. 工作区与启动方式

- 增加根据服务端用户 home 目录生成的 `home`、`code`、`work`、`super` 四个快捷入口。
- 本 fork 使用 `30140`，可以和使用 `30141` 的上游实例并行运行。
- 增加只监听回环地址的 `dev`、`start`，以及明确用于局域网的 `dev:lan`、`start:lan`。
- 保留 npm 包启动器的 `--port`、`--hostname` 和 `--no-open` 参数。

## 已引入的上游 v0.8.0 更新

本 fork 现已包含上游 v0.8.0 的完整功能，以及升级时可用的最新后续修复：

- Pi SDK 包升级并精确固定到 `0.81.1`。
- Git 感知的 Explorer 状态标记和文件 diff 查看器。
- 自动会话命名，并包含 v0.8.0 之后的 `streamFn` 兼容修复。
- 支持通过 `cwd` URL 参数直接打开工作目录。
- 支持 `!`、`!!` Shell 命令前缀、稳定执行及 Bash 输出读取。
- Web 会话记录支持无头自定义 TUI 渲染。
- 服务端请求支持标准 `HTTP_PROXY`、`HTTPS_PROXY` 和 `NO_PROXY` 环境变量。
- 文件标签支持鼠标中键关闭，会话标题操作文案更清晰。

## 保留的上游能力

以下主要能力来自 `agegr/pi-web`，并在本 fork 中继续保留：

- 按项目组织的会话浏览、实时聊天、Session Fork 和会话内分支。
- 模型与 Provider 配置、API Key 或 Provider 登录、thinking、工具、Skill 和插件管理。
- Explorer 上传、文件引用、源码与 diff 查看，以及图片、音频、PDF 和 DOCX 预览。
- Git worktree 的发现、切换、新建和删除。
- 上下文占用、Token、费用、系统提示、压缩状态和 HTML 会话导出。

原始架构和上游发行历史请参考 [agegr/pi-web](https://github.com/agegr/pi-web)。

## 快速指南

### 1. Clone 本增强版

Clone 实际发布这个增强版本的仓库：

```bash
git clone https://github.com/zhuguadundan/pi-web-secure.git
cd pi-web-secure
```

本项目最初 fork 自 [`agegr/pi-web`](https://github.com/agegr/pi-web)。普通使用者应 clone 本增强版仓库，而不是上游仓库，否则不会包含本文所述的认证、PWA、工作区快捷入口和聊天文件上传功能。

### 2. 环境要求

需要安装：

- Node.js 20 或更高版本，推荐 Node.js 22 或 24。
- npm。
- 可正常运行的本地 Pi，以及通常位于 `~/.pi/agent` 的 Pi agent 目录。
- 如果需要在网页中管理 Git worktree，还需要 Git。

Web UI 应运行在拥有 Pi 会话、模型、API Key、Skill、插件和项目目录权限的机器上。其他设备通过浏览器访问这台机器。

### 3. 安装依赖

进入 clone 下来的仓库：

```bash
npm install
```

如果你直接使用本仓库，请使用你实际发布增强版的 GitHub 仓库地址。

### 4. 本机运行

只在可信本机或仅监听回环地址时，可以先不启用认证：

```bash
npm run dev
# 打开 http://localhost:30140
```

运行生产构建：

```bash
npm run build
npm run start
# 打开 http://localhost:30140
```

默认脚本只监听 localhost。需要让局域网设备访问时，使用专门的局域网脚本：

```bash
npm run dev:lan
npm run start:lan
```

也可以直接调用本地 Next.js 指定其他监听地址，例如 `node_modules/.bin/next start -H 192.168.1.20 -p 30140`。

不要把未启用认证的实例直接暴露到互联网。

### 5. 开启密码认证

创建本地环境文件。`.env.local` 已被 Git 忽略：

```bash
cat > .env.local <<'EOF'
PI_WEB_AUTH_PASSWORD=请替换为足够长的随机密码
EOF
```

密码至少 10 个字符。然后构建并启动：

```bash
npm run build
npm run start:lan
```

访问 `http://<服务器IP>:30140`，登录页会保护整个 Web UI 和 API。`.env.local` 必须保密，不能提交到 GitHub。

### 6. 使用界面

1. 在左侧选择项目目录。
2. 选择已有会话，或创建新会话。
3. 使用 Explorer 浏览文件、插入文件引用、上传文件和打开预览。
4. 把图片拖进聊天区，会作为下一条消息的图片附件。
5. 把 Word、Excel、PDF、ZIP 或其他普通文件拖进聊天区，会上传到当前项目。
6. 如果出现同名冲突，选择 **Replace**、**Skip existing** 或 **Cancel**。
7. 发送消息前检查输入框中自动插入的 `@文件名`。
8. 对 Git 项目，可以用 worktree 选择器切换新会话和 Explorer 使用的 checkout。

当前版本有意不支持拖入整个文件夹，请选择单个或多个文件。

### 7. 通过反向代理安全分享

如果要让其他人远程访问，建议由反向代理终止 HTTPS，再把请求转发到私网中的 Pi Web：

```text
浏览器 -- HTTPS --> 反向代理 -- 私网 HTTP --> Pi Web :30140
```

即使反向代理本身有访问控制，也建议设置强随机的 `PI_WEB_AUTH_PASSWORD`。反向代理需要正确转发 Cookie、POST 请求体、文件上传和持续时间较长的 SSE 事件流。不要缓存认证页面、API 响应、文件预览、文件下载或事件流。

公网访问地址必须使用 HTTPS，PWA 才能正常安装。如果反向代理与 Pi Web 不在同一台机器，尽量只监听私网地址：

```bash
node_modules/.bin/next start -H 192.168.1.20 -p 30140
```

请把地址替换成服务器的实际私网地址。不同反向代理的配置写法不同，但需要特别检查 SSE/流式连接、multipart 文件上传、请求体大小限制和超时时间。

### 8. 使用 systemd 用户服务

可以使用 systemd user service 保持生产服务运行。请按目标机器修改用户和路径：

```ini
# ~/.config/systemd/user/pi-web-secure.service
[Unit]
Description=Pi Web Secure
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/your-user/pi-web-secure
EnvironmentFile=/home/your-user/pi-web-secure/.env.local
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
```

构建完成后启用：

```bash
systemctl --user daemon-reload
systemctl --user enable --now pi-web-secure.service
systemctl --user status pi-web-secure.service
```

如果希望用户退出登录后服务仍继续运行，可以按需启用 lingering：

```bash
loginctl enable-linger your-user
```

### 9. 使用其他 Pi agent 目录

默认读取当前用户的 `~/.pi/agent`。如果要使用其他目录：

```bash
PI_CODING_AGENT_DIR=/path/to/.pi/agent npm run start
```

该目录应包含要管理的 Pi 配置和会话数据。不要让两个 Web UI 同时向同一个活跃会话发送消息，也不要从多个客户端同时修改模型、Skill、插件或 worktree 配置。

## 运行时配置

| 环境变量 / 参数 | 作用 | 默认值 |
| --- | --- | --- |
| `PI_WEB_AUTH_PASSWORD` | 开启密码认证，至少 10 个字符 | 未开启 |
| `PI_CODING_AGENT_DIR` | Pi agent 数据目录 | `~/.pi/agent` |
| `PORT` 或 `--port` / `-p` | HTTP 端口 | `30140` |
| `HOSTNAME` 或 `--hostname` / `-H` | npm 包启动器使用的监听地址 | 未设置 |
| `npm run dev` / `npm run start` | 只监听回环地址的 npm script | `127.0.0.1:30140` |
| `npm run dev:lan` / `npm run start:lan` | 局域网可访问的 npm script | `0.0.0.0:30140` |
| `PI_WEB_NO_OPEN=1` 或 `--no-open` | 不自动打开浏览器 | `pi-web` 启动器默认自动打开 |

仓库提供了 `dev:lan` 和 `start:lan`，默认监听 `0.0.0.0`。如果需要指定其他地址或端口，可以直接调用本地 Next.js：

```bash
node_modules/.bin/next start -H 192.168.1.20 -p 30140
```

如果使用已构建 npm 包中的启动器：

```bash
node bin/pi-web.js --hostname 127.0.0.1 --port 30140 --no-open
```

## 数据、权限与安全边界

- 会话文件通常位于 `~/.pi/agent/sessions/<编码后的工作目录>/`。
- 模型、Provider 凭据、Skill 和插件由服务进程使用的 Pi agent 配置决定。
- 文件浏览、预览、上传和下载受允许的项目根目录及当前工作目录限制。
- 上传文件只使用客户端提交的文件名写入当前目录，不允许客户端提交任意目标路径。
- Web 密码不会改变操作系统文件权限。服务应使用确实需要访问这些项目的最低权限用户运行。
- 能登录 Web UI 就等同于拥有该 Pi 用户的文件和 Agent 能力，应使用 HTTPS、强密码和私网监听或已认证的反向代理。
- 不要把真实密码、API Key、会话文件、`.env.local` 或个人项目数据提交到公开 GitHub 仓库。

## 开发与验证

```bash
npm install
npm run dev
```

增强版常用检查：

```bash
node_modules/.bin/tsc --noEmit
node --test $(rg --files | rg '(test|spec)\.mjs$')
npm run build
```

仓库没有 `npm test` script，测试使用 Node 内置 test runner。生产构建会写入 `.next/`，通常只在发布验证时执行。

## 项目结构

```text
app/
  api/                  # Pi 会话、Agent RPC、文件、模型、Skill、认证、worktree
  login/                # 密码登录页
  manifest.ts           # PWA manifest
components/
  AppShell.tsx          # 主布局和认证后的应用壳
  SessionSidebar.tsx    # 项目、会话、worktree、Explorer
  ChatWindow.tsx        # 消息、SSE、聊天区拖拽
  ChatInput.tsx         # 编辑器、图片附件、命令和模型控制
  FileExplorer.tsx      # 文件树和 Explorer 上传
  FileViewer.tsx        # 源码、diff、图片、音频、PDF、DOCX 预览
  UploadFeedback.tsx    # 共用上传进度和冲突界面
hooks/
  useFileUpload.ts      # 共用上传状态机
  useDragDrop.ts        # 文件拖拽分类和事件处理
lib/
  web-auth.ts           # 签名认证 Token 辅助函数
  file-upload.ts        # 服务端上传校验和冲突检查
  file-access.ts        # 允许根目录和文件访问边界
  worktree.ts           # Git worktree 发现与管理
proxy.ts                # 认证和请求安全边界
public/
  sw.js                 # 不缓存敏感数据的 Service Worker
  icons/                # PWA 图标
```

## 将增强版发布到 GitHub

当前工作树继承了上游项目的 Git 历史。第一次推送前，先在自己的 GitHub 账号中新建一个空仓库，然后把增强版远程和上游远程分开：

```bash
git remote rename origin upstream
git remote add origin git@github.com:zhuguadundan/pi-web-secure.git
git status --short
# 逐项检查后，再暂存完整增强源码。
git add -A
git diff --cached --check
git diff --cached --stat
git commit -m "Add secure PWA and file workflow enhancements"
git push -u origin main
```

提交前运行 `git status --short`，确认 `.env.local`、密码、API Key、Pi 会话、个人项目、构建产物和机器专用服务文件没有被暂存。准备以自己的账号发布 npm 包或 GitHub Release 时，还应修改 `package.json` 中的仓库地址、homepage、bugs、包名和 release script。

## 与上游项目的关系

本项目基于 [`agegr/pi-web`](https://github.com/agegr/pi-web) 修改。上游项目仍是原始 Pi Web 架构、基础界面和发行历史的参考。本仓库在尽量保留上游结构的基础上，增加了本文档所列的部署安全、认证、PWA、工作区和文件上传能力。

如果要向上游提交修复，请区分通用 Pi Web 改进和仅适用于个人部署的功能。发布自己的 fork 时，请同步修改仓库地址、package 元数据、截图、服务示例以及任何机器特定的默认配置。

## 许可证

本项目保留上游 MIT 许可证，详见 [LICENSE](./LICENSE)。
