import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const themeSource = await readFile(new URL("../hooks/useTheme.ts", import.meta.url), "utf8");
const layoutSource = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const sessionsRoute = await readFile(new URL("../app/api/sessions/route.ts", import.meta.url), "utf8");
const runningRoute = await readFile(new URL("../app/api/agent/running/route.ts", import.meta.url), "utf8");
const eventRoute = await readFile(new URL("../app/api/agent/[id]/events/route.ts", import.meta.url), "utf8");
const sidebarSource = await readFile(new URL("../components/SessionSidebar.tsx", import.meta.url), "utf8");
const messageSource = await readFile(new URL("../components/MessageView.tsx", import.meta.url), "utf8");
const inputSource = await readFile(new URL("../components/ChatInput.tsx", import.meta.url), "utf8");
const agentHookSource = await readFile(new URL("../hooks/useAgentSession.ts", import.meta.url), "utf8");

test("theme supports light, dark, and system preferences", () => {
  assert.match(themeSource, /ThemePreference = "light" \| "dark" \| "auto"/);
  assert.match(themeSource, /prefers-color-scheme: dark/);
  assert.match(themeSource, /addEventListener\("change", syncAutoThemeFromSystem\)/);
  assert.match(layoutSource, /t==="auto"/);
});

test("session and running snapshots explicitly bypass caches", () => {
  assert.match(sessionsRoute, /searchParams\.get\("force"\) === "1"/);
  assert.match(sessionsRoute, /"Cache-Control": "no-store"/);
  assert.match(runningRoute, /"Cache-Control": "no-store"/);
  assert.match(sidebarSource, /setTimeout\(\(\) => void poll\(\), 2500\)/);
  assert.match(sidebarSource, /loadSessions\(false, true\)/);
  assert.match(sidebarSource, /sessionLoadIdRef/);
  assert.match(sidebarSource, /loadId !== sessionLoadIdRef\.current/);
});

test("agent events support reconnect snapshots and unbuffered SSE", () => {
  assert.match(eventRoute, /isRunning: session\.isRunning\(\)/);
  assert.match(eventRoute, /isStreaming: session\.isStreaming/);
  assert.match(eventRoute, /message_start/);
  assert.match(eventRoute, /cancel\(\)/);
  assert.match(eventRoute, /no-cache, no-transform/);
  assert.match(eventRoute, /X-Accel-Buffering/);
  assert.match(agentHookSource, /eventReconnectTimerRef/);
  assert.match(agentHookSource, /clearTimeout\(eventReconnectTimerRef\.current\)/);
});

test("message actions preserve complete user messages including images", () => {
  assert.match(messageSource, /onEditContent\?\.\(message\)/);
  assert.match(inputSource, /replaceMessage: \(message: UserMessage\)/);
  assert.match(inputSource, /getUserMessageDraftImages/);
  assert.match(messageSource, /Edit from here/);
  assert.match(messageSource, /New session/);
});
