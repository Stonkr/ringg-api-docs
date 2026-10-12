import type { Scenario } from "../run.ts";
import { whatsappChatRoutes } from "../fixtures/whatsapp-chats.ts";

export default {
  name: "whatsapp-chat-history",
  docsPage: "whatsapp/chat-history",
  routes: whatsappChatRoutes,
  async run(s) {
    const p = s.page;
    await s.goto("/logs/whatsapp");
    await s.caption("Logs → WhatsApp lists every chat, newest first", 1800);
    await s.shot("chat-list", p.locator("main"));

    await s.caption("Click Filters", 400);
    await s.click(p.getByRole("button", { name: /^Filters/ }), 800);
    const panel = p.getByRole("dialog").first();
    await s.caption("Narrow by chat status", 400);
    await s.click(panel.getByRole("button", { name: /^Chat status/ }), 500);
    await s.click(panel.getByText("Completed", { exact: true }), 700);
    await s.caption("Or by the customer's number, your number or a chat ID", 400);
    await s.click(panel.getByRole("button", { name: /^From number/ }), 500);
    await s.type(panel.getByRole("searchbox", { name: "From number" }), "+919876545012");
    await p.keyboard.press("Enter");
    await s.pause(900);
    await s.caption("Filters show as chips and stay in the page URL", 1500);
    await p.keyboard.press("Escape");
    await s.pause(300);

    await s.caption("Click a chat to open it", 400);
    await s.click(p.getByText("Priya Nair", { exact: true }), 1800);
    const chatPanel = p.getByRole("tablist", { name: "Call analysis sections" }).locator("xpath=ancestor::*[.//button[@aria-label='Call actions']][1]");
    await s.caption("Chat details: duration, variables and platform analysis", 1800);
    await s.shot("chat-details", chatPanel, 2);

    await s.caption("Advanced analysis: your own fields", 400);
    await s.click(p.getByRole("tab", { name: "Advanced analysis" }), 1500);

    await s.caption("Transcript: WhatsApp bubbles, template sends and tool pills", 400);
    await s.click(p.getByRole("tab", { name: "Transcript" }), 1800);
    await s.shot("transcript", chatPanel, 2);
    await s.caption("Click a tool pill for its request and response", 400);
    await s.click(p.getByRole("button", { name: /Fetch Loan Details/ }), 1200);
    await s.click(p.getByRole("tab", { name: "Response" }), 1300);
    await p.keyboard.press("Escape");
    await s.pause(400);

    await s.caption("The menu copies or downloads the transcript", 400);
    await s.click(p.getByRole("button", { name: "Call actions" }), 1500);
    await p.keyboard.press("Escape");
    await s.pause(300);
    await p.mouse.click(700, 80);
    await s.pause(600);

    await s.caption("Export the filtered list by email", 400);
    await s.click(p.getByRole("button", { name: "Export" }), 700);
    await s.click(p.getByRole("menuitem", { name: "Export with analysis" }), 600);
    await s.caption("The CSV arrives by email as a zip link", 2000);
  },
} satisfies Scenario;
