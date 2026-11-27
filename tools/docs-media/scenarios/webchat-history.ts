import type { Scenario } from "../run.ts";
import { makeEditorBRoutes, SL_ID, shotNoToasts } from "../fixtures/editor-b.ts";
import { openAcmeSite } from "../fixtures/webchat.ts";

// The widget part needs WIDGET_DIST (see fixtures/webchat.ts).
export default {
  name: "webchat-history",
  docsPage: "documentation/deploy/web-and-apps/web-widget/chat-history",
  title: "Web chat history",
  viewport: { width: 1152, height: 720 },
  routes: makeEditorBRoutes(),
  async run(s) {
    const p = s.page;
    await s.goto(`/assistants/${SL_ID}`);
    await s.caption("Open the agent and select Chat settings", 900);
    await s.click(p.getByRole("button", { name: /^Navigate to Chat/ }).first(), 1200);
    await s.caption("Turn on Show past chats in the widget", 500);
    const toggle = p.getByRole("switch", { name: "Show past chats in the widget" });
    await s.click(p.locator("label").filter({ has: toggle }).first(), 1200);
    await s.caption("Choose how long chats are kept and how much the agent re-reads", 1800);
    await shotNoToasts(s, "chat-history-setting", p.getByText("Chat history", { exact: true }).locator("xpath=ancestor::div[.//*[normalize-space()='Recent messages the agent re-reads']][1]"));

    await openAcmeSite(p);
    await s.caption("On your site, a visitor opens the widget", 500);
    await s.click(p.getByRole("button", { name: "Open call widget" }), 1200);
    await s.caption("Click the History button to see past chats", 500);
    await s.click(p.getByRole("button", { name: "Your chats" }), 1500);
    await s.shot("history-list", p.locator('[data-ringg="widget-root"]'), 8);
    await s.caption("Click a chat to reopen it, widgets included", 500);
    await s.click(p.getByText("EMI for a ₹5 lakh personal loan"), 1800);
    await s.shot("reopened-chat", p.locator('[data-ringg="widget-root"]'), 8);
    await s.caption("Typing a message carries on the same chat", 2000);
  },
} satisfies Scenario;
