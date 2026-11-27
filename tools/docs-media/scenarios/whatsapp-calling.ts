import type { Scenario } from "../run.ts";
import { WA_ID } from "../fixtures/whatsapp-agents.ts";
import { makeWhatsappCallingRoutes } from "../fixtures/whatsapp-calling.ts";

// Screenshots only (no captions, so no video) for the WhatsApp calling page.
export default {
  name: "whatsapp-calling",
  docsPage: "documentation/build-agents/agents/whatsapp-agents/calling",
  routes: makeWhatsappCallingRoutes(),
  async run(s) {
    const p = s.page;
    const sidebar = p.getByRole("tab", { name: "Chat" }).locator("xpath=ancestor::aside[1]");

    await s.goto(`/assistants/${WA_ID}`);
    await s.click(p.getByRole("tab", { name: "Call" }), 2000);
    await p.getByText("Choose the voice callers should hear").waitFor();
    await s.shot("calling-01-agent-call-tab");

    await s.click(p.getByRole("tab", { name: "Chat" }), 2000);
    await s.shot("calling-02-agent-chat-tab");

    await s.click(p.getByRole("button", { name: "Test assistant" }), 1500);
    const testDialog = p.getByRole("dialog").last();
    await testDialog.getByText("To test calling, open the chat and tap the call button.").waitFor();
    await s.pause(800);
    await s.shot("calling-05-test-panel", testDialog, 0);
    await p.keyboard.press("Escape");
    await s.pause(600);

    await s.click(p.getByRole("tab", { name: "Call" }), 2000);
    await s.click(p.getByRole("button", { name: "Navigate to Event Subscription" }), 1300);
    await s.click(p.getByRole("button", { name: "Create subscription" }).first(), 1000);
    const form = p.locator('xpath=//span[normalize-space()="New subscription"]/ancestor::div[contains(@class,"rounded-xl")][1]');
    await s.shot("calling-09-webhooks", form);

    await s.click(p.getByRole("button", { name: /Attach Number/ }), 1200);
    const picker = p.getByRole("combobox", { name: "WhatsApp number" });
    await s.hover(picker, 400);
    // The field's clear (×) button sits just before Show suggestions.
    await s.click(picker.locator('xpath=following-sibling::div[1]/button[1]'), 1000);
    const confirm = p.getByRole("alertdialog");
    await confirm.waitFor();
    await s.shot("calling-04-detach-confirm", confirm, 0);
    await s.click(confirm.getByRole("button", { name: "Cancel" }), 600);

    await s.goto(`/integrations/whatsapp/tel_wa_acme`);
    await s.click(p.getByRole("button", { name: "Call settings for +91 98765 40321" }).last(), 1500);
    const settings = p.getByRole("dialog").filter({ hasText: "Call settings" });
    await settings.getByText("Allow voice calls").waitFor();
    await s.pause(800);
    await s.shot("calling-03-number-settings", settings, 0);
    await p.keyboard.press("Escape");

    await s.goto("/logs/whatsapp");
    await s.click(p.getByRole("button", { name: /^Filters/ }), 800);
    const panel = p.getByRole("dialog").first();
    await s.click(panel.getByRole("button", { name: /^Type/ }), 700);
    await s.shot("calling-06-logs", p.locator("main"));
    await p.keyboard.press("Escape");
    await s.pause(400);

    await s.click(p.getByText("Kiran Desai", { exact: true }), 2500);
    const callPanel = p.getByRole("tablist", { name: "Call analysis sections" }).locator("xpath=ancestor::*[.//button[@aria-label='Call actions']][1]");
    await s.click(p.getByRole("tab", { name: "Transcript" }), 1500);
    await s.shot("calling-07-call-drawer", callPanel, 2);

    await s.goto("/analytics/whatsapp");
    // The Calls section: the nearest block around its tiles that also holds a chart.
    const calls = p.getByText("Total minutes", { exact: true }).locator("xpath=ancestor::*[.//*[@_echarts_instance_]][1]");
    await calls.locator("[_echarts_instance_]").waitFor();
    await calls.evaluate((el) => el.scrollIntoView({ block: "end" }));
    await s.pause(1500);
    await s.shot("calling-08-analytics", calls, 0, true);
  },
} satisfies Scenario;
