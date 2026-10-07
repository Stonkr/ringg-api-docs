import type { Scenario } from "../run.ts";
import { makeEditorBRoutes, PR_ID, shotNoToasts } from "../fixtures/editor-b.ts";

export default {
  name: "agents-event-subscription",
  docsPage: "agents/event-subscription",
  routes: makeEditorBRoutes(),
  async run(s) {
    const p = s.page;
    await s.goto(`/assistants/${PR_ID}`);
    await s.caption("Open Event Subscription", 800);
    await s.click(p.getByRole("button", { name: "Navigate to Event Subscription" }), 1400);

    await s.caption("Click Create Subscription", 600);
    await s.click(p.getByRole("button", { name: "Create subscription" }), 1000);
    const form = p.locator('xpath=//span[normalize-space()="New subscription"]/ancestor::div[contains(@class,"rounded-xl")][1]');

    await s.caption("Set the method and URL", 500);
    await s.click(p.locator('[aria-label="HTTP method"]'), 600);
    await s.click(p.locator('[role="option"]').filter({ hasText: /^POST$/ }).locator("visible=true").first(), 600);
    await s.type(form.getByLabel("Callback URL"), "https://api.acme-lending.example/webhooks/ringg");

    await s.caption("Select events; hover the info icon for details", 500);
    await s.click(form.getByText("Call Completed", { exact: true }), 400);
    await s.hover(form.getByRole("button", { name: "About Call Completed" }), 1500);
    for (const ev of ["Recording Ready", "Advanced Analysis Complete"]) {
      await s.click(form.getByText(ev, { exact: true }), 500);
    }

    await s.caption("Add a header (optional)", 500);
    await s.click(form.getByRole("button", { name: "Add header" }), 600);
    await s.type(form.getByLabel("Header key").last(), "Authorization");
    await s.type(form.getByLabel("Header value").last(), "Bearer whsec_acme_4f9c21");
    await shotNoToasts(s, "new-subscription", form);

    await s.caption("Click Create Subscription", 500);
    await s.click(form.getByRole("button", { name: "Create subscription" }), 1600);
    await s.caption("The card shows the URL, events and headers", 1500);
    await shotNoToasts(s, "subscriptions", p.locator('xpath=//h3[normalize-space()="Webhook Subscriptions"]/ancestor::div[contains(@class,"md:flex-row")][1]'));

    await s.caption("Edit a subscription from its menu", 500);
    await s.click(p.getByRole("button", { name: "Subscription actions" }).first(), 700);
    await s.click(p.getByRole("menuitem", { name: "Edit" }), 900);
    const edit = p.locator('xpath=//button[@aria-label="Update subscription"]/ancestor::div[contains(@class,"rounded-xl")][1]');
    await s.caption("Add an event, then click Update subscription", 500);
    await s.click(edit.getByText("All Processing Done", { exact: true }), 800);
    await s.click(edit.getByRole("button", { name: "Update subscription" }), 1600);
    await s.caption("Each event takes up to 4 subscriptions", 1500);
  },
} satisfies Scenario;
