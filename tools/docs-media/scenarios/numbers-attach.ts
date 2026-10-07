import type { Scenario } from "../run.ts";
import { makeEditorBRoutes, SL_ID, shotNoToasts } from "../fixtures/editor-b.ts";

export default {
  name: "numbers-attach",
  docsPage: "numbers/attach-to-agent",
  routes: makeEditorBRoutes(),
  async run(s) {
    const p = s.page;
    const option = (text: string) => p.locator('[role="option"]').filter({ hasText: text }).locator("visible=true").first();
    const panel = p.locator('xpath=//span[normalize-space()="Attach Number"]/ancestor::div[@data-slot="base" or contains(@class,"rounded-xl")][1]');
    const telephony = p.getByPlaceholder("Select telephony");
    const numberField = p.getByPlaceholder("Select a number");

    await s.goto(`/assistants/${SL_ID}`);
    await s.caption("Open the inbound agent (Support line)", 1200);
    await s.caption("Expand Attach Number in the sidebar", 500);
    await s.click(p.getByRole("button", { name: "Attach Number" }), 1000);

    await s.caption("Filter by telephony: your provider's numbers", 500);
    await s.click(telephony, 700);
    await s.click(option("Exotel Mumbai"), 800);
    await s.click(numberField, 1300);
    await p.keyboard.press("Escape");
    await s.caption("Or Ringg's own numbers", 300);
    await s.click(telephony, 600);
    await s.click(option("Ringg"), 700);

    await s.caption("Pick the number under Inbound Number", 500);
    await s.click(numberField, 1100);
    await shotNoToasts(s, "number-list");
    await s.click(option("+919876541209"), 1200);

    await s.caption("The number is attached; no separate save", 1200);
    await shotNoToasts(s, "attached", panel, 12);
    await s.click(p.getByRole("button", { name: "Copy inbound number" }), 900);

    await s.caption("Outbound: pick the caller ID when you call", 500);
    await s.click(p.getByRole("link", { name: "Assistants" }), 1200);
    await s.click(p.getByText("Payment reminder", { exact: true }).first(), 1300);
    await s.click(p.getByRole("button", { name: /Test assistant/ }), 900);
    const d = p.getByRole("dialog");
    await s.click(d.locator('[data-slot="autocomplete-trigger"]').first(), 1000);
    await s.caption("Test numbers, your numbers; in-use ones are disabled", 2200);
  },
} satisfies Scenario;
