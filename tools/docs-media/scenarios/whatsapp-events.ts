import type { Scenario } from "../run.ts";
import { shotNoToasts } from "../fixtures/editor-b.ts";
import { WA_ID, makeWhatsappEditorRoutes } from "../fixtures/whatsapp-agents.ts";

export default {
  name: "whatsapp-events",
  docsPage: "whatsapp/events",
  routes: makeWhatsappEditorRoutes(),
  async run(s) {
    const p = s.page;
    await s.goto(`/assistants/${WA_ID}`);
    await s.caption("Open the WhatsApp agent's Event Subscription", 600);
    await s.click(p.getByRole("button", { name: "Navigate to Event Subscription" }), 1300);

    const form = p.locator('xpath=//span[normalize-space()="New subscription"]/ancestor::div[contains(@class,"rounded-xl")][1]');
    // With no subscriptions yet the form is already open; otherwise Create Subscription opens it.
    if (!(await form.isVisible())) {
      await s.caption("Click Create Subscription", 500);
      await s.click(p.getByRole("button", { name: "Create subscription" }), 1000);
    } else await s.caption("The New subscription form is open", 1000);

    await s.caption("Set the method and your callback URL", 500);
    await s.click(p.locator('[aria-label="HTTP method"]'), 600);
    await s.click(p.locator('[role="option"]').filter({ hasText: /^POST$/ }).locator("visible=true").first(), 600);
    await s.type(form.getByLabel("Callback URL"), "https://api.acme-lending.example/webhooks/ringg-chat");

    await s.caption("A WhatsApp agent offers the four chat events only", 500);
    await s.click(form.getByText("Chat Completed", { exact: true }), 400);
    await s.hover(form.getByRole("button", { name: "About Chat Completed" }), 1500);
    await s.caption("Tick the events you want", 400);
    await s.click(form.getByText("Advanced Analysis Complete", { exact: true }), 500);
    await s.click(form.getByText("All Processing Done", { exact: true }), 500);

    await s.caption("Add a header, such as an Authorization token", 500);
    await s.click(form.getByRole("button", { name: "Add header" }), 600);
    await s.type(form.getByLabel("Header key").last(), "Authorization");
    await s.type(form.getByLabel("Header value").last(), "Bearer whsec_acme_7d2c91");
    await shotNoToasts(s, "new-subscription", form);

    await s.caption("Click Create Subscription", 500);
    await s.click(form.getByRole("button", { name: "Create subscription" }), 1600);
    await s.caption("The subscription lists its URL, events and headers", 1500);
    await shotNoToasts(s, "subscriptions", p.locator('xpath=//h3[normalize-space()="Webhook Subscriptions"]/ancestor::div[contains(@class,"md:flex-row")][1]'));
    await s.caption("Close a test chat with @||end_chat|| to receive chat_completed", 2200);
  },
} satisfies Scenario;
