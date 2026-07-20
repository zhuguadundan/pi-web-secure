# Pi Web Secure

[中文文档](./README.zh-CN.md) · [Upstream project: agegr/pi-web](https://github.com/agegr/pi-web)

A security-focused and workflow-enhanced fork of [`agegr/pi-web`](https://github.com/agegr/pi-web), the browser UI for the [Pi coding agent](https://github.com/badlogic/pi-mono).

This repository keeps the upstream Pi Web experience and adds practical features for running Pi Web on a LAN, behind a reverse proxy, or as a private mobile PWA. It reads the local Pi session and configuration files directly, so it is intended to run on the same machine that owns the Pi environment.

![Pi Web showing a Pi session, structured messages, tool calls, and project navigation](./docs/screenshot2.png)

> **Important:** This repository is source code for the enhanced build. `npx @agegr/pi-web` installs the npm package published under the upstream package name; it does not automatically install this GitHub working tree. For the enhanced build, clone this repository and build it locally, or publish your own npm package from this source.

## What This Fork Changes

The current enhancement work starts from upstream `agegr/pi-web` v0.7.16. The following items describe changes made in this fork relative to that upstream release.

### Security and private network deployment

- Optional single-password web authentication through `PI_WEB_AUTH_PASSWORD`.
- Authentication covers the page, API routes, SSE agent streams, file previews, and file downloads.
- Signed, HTTP-only, same-site authentication cookies with a 30-day session lifetime.
- Changing the configured password invalidates existing sessions.
- Cross-site write protection for state-changing requests.
- Security response headers including `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`.
- Private, no-store caching for authenticated application responses.
- Authentication-disabled mode remains available when `PI_WEB_AUTH_PASSWORD` is not set, which preserves upstream-style local development behavior.

### PWA and mobile support

- Installable Progressive Web App with manifest, icons, maskable icons, and Apple touch icon.
- Mobile-safe-area layout support for phones with notches and home indicators.
- Responsive login screen and mobile sidebar behavior.
- Service worker intentionally avoids caching conversations, API responses, or project files. This keeps the application from serving stale or sensitive workspace data offline.
- PWA installation requires HTTPS in normal browser deployments. `localhost` is also treated as a secure development origin by modern browsers.

### Chat file workflow

- Extends upstream's Explorer upload support to the chat drop zone.
- Drag ordinary files into the chat area to upload them to the current working directory.
- Images remain model image attachments; Word, Excel, PDF, ZIP, and other ordinary files become workspace uploads.
- Mixed drops are split automatically into image attachments and ordinary files.
- Reuses one upload controller for Explorer and chat uploads, including preflight checks, progress, errors, and result summaries.
- Keeps upstream's same-name conflict actions: replace, skip, or cancel.
- Refreshes the Explorer after a successful chat upload.
- Automatically inserts an `@filename` reference into the message editor.
- Ignores stale upload results if the user changes working directory while a request is still running.
- Retains server-side validation for unsafe names, traversal attempts, conflict strategies, and disallowed roots.

### Workspace and launch behavior

- Adds four fixed project-picker shortcuts derived from the server user's home directory: `home`, `code`, `work`, and `super`.
- Uses `30140` for this fork so it can run beside an upstream instance on `30141`.
- Adds loopback-only `dev` and `start` scripts plus explicit `dev:lan` and `start:lan` scripts.
- Keeps the packaged launcher options `--port`, `--hostname`, and `--no-open`.

## Upstream Capabilities Retained

The following major features come from `agegr/pi-web` and remain available in this fork:

- Project-grouped session browsing, real-time chat, session forks, and in-session branches.
- Model/provider configuration, API-key or provider login, thinking controls, tools, Skills, and plugins.
- File Explorer upload, file mentions, source and diff views, and image, audio, PDF, and DOCX previews.
- Git worktree discovery, switching, creation, and removal.
- Context usage, token and cost information, system prompt inspection, compaction state, and HTML session export.

See the [upstream repository](https://github.com/agegr/pi-web) for the original architecture and upstream release history.

## Quick Guide

### 1. Clone this enhanced fork

Clone the repository where this enhanced version is published:

```bash
git clone https://github.com/zhuguadundan/pi-web-secure.git
cd pi-web-secure
```

This project was originally forked from [`agegr/pi-web`](https://github.com/agegr/pi-web). End users should clone this enhanced repository, not the upstream repository, to receive the authentication, PWA, workspace, and chat upload changes described here.

### 2. Prerequisites

Install:

- Node.js 20 or newer. Node.js 22 or 24 is recommended.
- npm.
- A working local Pi installation and its agent directory, normally `~/.pi/agent`.
- Git if you want worktree management from the UI.

The web UI should run on the machine where Pi, its session files, models, API keys, skills, and project directories are available. A remote browser connects to this machine; it does not move the Pi runtime to the browser device.

### 3. Install dependencies

From the cloned repository:

```bash
npm install
```

If you are using this repository directly rather than your own fork, use the repository URL where you published the enhanced source.

### 4. Run locally without authentication

Use this mode only on a trusted local machine or a loopback-only listener:

```bash
npm run dev
# Open http://localhost:30140
```

For a production build:

```bash
npm run build
npm run start
# Open http://localhost:30140
```

The standard npm scripts bind to localhost. For a LAN-only deployment, use the explicit LAN scripts:

```bash
npm run dev:lan
npm run start:lan
```

You can also choose another bind address with the underlying Next.js command, for example `node_modules/.bin/next start -H 192.168.1.20 -p 30140`.

Do not expose an unauthenticated instance to the Internet.

### 5. Enable password authentication

Create a local environment file. `.env.local` is ignored by Git:

```bash
cat > .env.local <<'EOF'
PI_WEB_AUTH_PASSWORD=replace-this-with-a-long-random-password
EOF
```

The password must contain at least 10 characters. Start the production server:

```bash
npm run build
npm run start:lan
```

Open `http://<server-ip>:30140`. The login page protects the application and its APIs. Keep `.env.local` private and never commit it.

### 6. Use the UI

1. Select a project directory in the sidebar.
2. Select an existing session or start a new session.
3. Use the Explorer to browse files, mention files, upload files, and open previews.
4. Drag an image into the chat to attach it to the next message.
5. Drag a Word, Excel, PDF, ZIP, or other ordinary file into the chat to upload it to the current project.
6. Resolve a same-name conflict with **Replace**, **Skip existing**, or **Cancel**.
7. Check the inserted `@filename` reference before sending the message.
8. For Git repositories, use the worktree selector to switch the checkout used by new sessions and the Explorer.

Whole-folder drops are intentionally not supported. Select individual files or multiple files.

### 7. Share it safely through a reverse proxy

For a public or remote deployment, terminate HTTPS at a reverse proxy and forward traffic to Pi Web over the private network. A minimal topology is:

```text
Browser -- HTTPS --> reverse proxy -- HTTP/private network --> Pi Web :30140
```

Set a strong `PI_WEB_AUTH_PASSWORD` even when the proxy has its own access control. Preserve cookies, POST bodies, file uploads, and long-lived SSE responses. Do not cache authenticated pages, API responses, file previews, downloads, or event streams.

The public URL must use HTTPS for normal PWA installation. If your proxy is on another machine, bind Pi Web to the private interface rather than the public Internet interface whenever possible:

```bash
node_modules/.bin/next start -H 192.168.1.20 -p 30140
```

Replace the address with the server's private LAN address. The exact reverse-proxy configuration depends on your proxy software; ensure WebSocket/SSE-style streaming and multipart uploads are passed through without an aggressive timeout or body-size limit.

### 8. Run as a system service

A simple systemd user service can keep the production build running. Adjust the paths and user name for the target machine:

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

Enable it after building:

```bash
systemctl --user daemon-reload
systemctl --user enable --now pi-web-secure.service
systemctl --user status pi-web-secure.service
```

For a user service to stay alive after logout, enable lingering for that user when appropriate:

```bash
loginctl enable-linger your-user
```

### 9. Point Pi Web at another Pi agent directory

By default, Pi Web reads the current user's Pi data under `~/.pi/agent`. To use another agent directory:

```bash
PI_CODING_AGENT_DIR=/path/to/.pi/agent npm run start
```

The directory must contain the Pi configuration and session data that you want to manage. Avoid running two Web UIs against the same active session at the same time, and avoid changing models, skills, plugins, or worktrees concurrently from separate clients.

## Runtime Configuration

| Variable / option | Meaning | Default |
| --- | --- | --- |
| `PI_WEB_AUTH_PASSWORD` | Enables password authentication; minimum 10 characters | disabled |
| `PI_CODING_AGENT_DIR` | Pi agent data directory | `~/.pi/agent` |
| `PORT` or `--port` / `-p` | HTTP port | `30140` |
| `HOSTNAME` or `--hostname` / `-H` | Bind hostname used by the packaged launcher | unset |
| `npm run dev` / `npm run start` | Loopback-only npm scripts | `127.0.0.1:30140` |
| `npm run dev:lan` / `npm run start:lan` | LAN-accessible npm scripts | `0.0.0.0:30140` |
| `PI_WEB_NO_OPEN=1` or `--no-open` | Do not open a browser automatically | browser opens from `pi-web` launcher |

The repository provides `dev:lan` and `start:lan` for `0.0.0.0`. For another address or port, call the local Next.js binary directly, for example `node_modules/.bin/next start -H 192.168.1.20 -p 30140`. When using the CLI launcher from a built package, use:

```bash
node bin/pi-web.js --hostname 127.0.0.1 --port 30140 --no-open
```

## Data, Permissions, and Security Boundaries

- Session files are normally under `~/.pi/agent/sessions/<encoded-cwd>/`.
- Models, provider credentials, skills, and plugins are read from the Pi agent configuration used by the server process.
- File browsing, preview, upload, and download are scoped to allowed project roots and the selected working directory.
- Uploads are written to the selected directory using the uploaded filename, not an arbitrary client-provided path.
- A password protects the Web UI but does not change the operating-system permissions of the Pi process. Run the service as the least-privileged user that needs access to the projects.
- Treat browser access as access to the Pi user's files and agent capabilities. Use HTTPS, a strong password, and a private bind address or authenticated reverse proxy.
- Do not place real passwords, API keys, session files, `.env.local`, or personal project data in a public GitHub repository.

## Development and Verification

```bash
npm install
npm run dev
```

Run the focused checks used by this enhanced build:

```bash
node_modules/.bin/tsc --noEmit
node --test $(rg --files | rg '(test|spec)\.mjs$')
npm run build
```

The repository has no `npm test` script. The test files use Node's built-in test runner. A production build writes `.next/`; run it as part of release verification rather than during normal hot-reload development.

## Project Structure

```text
app/
  api/                  # Pi sessions, agent RPC, files, models, skills, auth, worktrees
  login/                # password login page
  manifest.ts           # PWA manifest
components/
  AppShell.tsx          # main layout and authenticated application shell
  SessionSidebar.tsx    # project selector, sessions, worktrees, Explorer
  ChatWindow.tsx        # messages, SSE, chat-area drag/drop
  ChatInput.tsx         # editor, image attachments, commands, model controls
  FileExplorer.tsx      # file tree and Explorer uploads
  FileViewer.tsx        # source, diff, image, audio, PDF, and DOCX preview
  UploadFeedback.tsx    # shared upload progress and conflict UI
hooks/
  useFileUpload.ts      # shared upload state machine
  useDragDrop.ts        # file drag/drop classification and event handling
lib/
  web-auth.ts           # signed authentication token helpers
  file-upload.ts        # upload validation and server-side conflict checks
  file-access.ts        # allowed-root and file access boundaries
  worktree.ts           # Git worktree discovery and management
proxy.ts                # authentication and request security boundary
public/
  sw.js                 # non-caching service worker
  icons/                # PWA icons
```

## Publishing Your Fork on GitHub

This working tree currently inherits its Git history from the upstream project. Before the first push, create an empty repository under your GitHub account, then separate your fork remote from upstream:

```bash
git remote rename origin upstream
git remote add origin git@github.com:zhuguadundan/pi-web-secure.git
git status --short
# Review every path, then stage the complete enhanced source.
git add -A
git diff --cached --check
git diff --cached --stat
git commit -m "Add secure PWA and file workflow enhancements"
git push -u origin main
```

Before committing, run `git status --short` and verify that `.env.local`, passwords, API keys, Pi sessions, personal projects, build output, and machine-specific service files are not staged. Update `package.json` repository, homepage, bugs, package name, and release scripts if you plan to publish packages or releases under your own account.

## Relationship to Upstream

This work is derived from [`agegr/pi-web`](https://github.com/agegr/pi-web). Upstream remains the reference for the original Pi Web architecture, baseline UI, and upstream release history. This repository adds the deployment, authentication, PWA, workspace, and file-upload changes described above while retaining the upstream project structure where practical.

When sending fixes upstream, keep changes focused and document whether they are generic Pi Web improvements or deployment-specific behavior. When publishing your own fork, update the repository URL, package metadata, screenshots, service examples, and any machine-specific defaults before sharing it publicly.

## License

This project retains the upstream MIT license. See [LICENSE](./LICENSE).
