import type { Scenario } from "../run.ts";
import { webchatLogsRoutes } from "../fixtures/webchat.ts";

export default {
  name: "webchat-logs",
  docsPage: "documentation/monitor/logs",
  title: "Web chats",
  routes: webchatLogsRoutes,
  async run(s) {
    const p = s.page;
    await s.goto("/logs/webchat");
    await s.caption("Logs → Webchat lists one row per chat, latest message first", 1800);
    await s.shot("chat-list", p.locator("main"));

    await s.caption("Click a chat to open it", 400);
    await s.click(p.getByText("Priya Sharma", { exact: true }), 1800);
    const chatPanel = p.getByRole("tablist", { name: "Call analysis sections" }).locator("xpath=ancestor::*[.//button[@aria-label='Call actions']][1]");
    await s.caption("The chat ID, total cost and turns cover every session", 400);
    await s.click(p.getByRole("tab", { name: "Call details" }), 1600);
    await s.shot("chat-details", chatPanel, 2);

    await s.caption("Transcript: every session, each with its own tool calls", 400);
    await s.click(p.getByRole("tab", { name: "Transcript" }), 1800);
    await s.shot("transcript", chatPanel, 2);
    await s.caption("Copy one session's call ID from its divider", 400);
    await s.hover(p.getByRole("button", { name: /^Copy call ID of Session 2/ }), 1600);
  },
} satisfies Scenario;
