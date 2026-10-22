import type { Scenario } from "../run.ts";
import ids from "../fixtures/analytics/ids.json" with { type: "json" };

// An agent disputes two parameters of an AI-scored call.
const DISPUTES: [string, string][] = [
  ["Gave the recording disclosure", "I said the call is recorded right after the greeting, at 0:06. Please listen again."],
  ["Stated the EMI amount and due date", "I told the customer the exact amount and the due date at about 0:20."],
];

export default {
  name: "disputes-raise",
  docsPage: "disputes/raise-a-dispute",
  title: "Raise a dispute",
  routes: {},
  analytics: { as: "vikram", fixture: "disputes-raise" },
  async run(s) {
    const p = s.page;
    await s.goto(`/interactions/${ids.calls.raise}`);
    const appeal = p.getByRole("button", { name: "Appeal this score" });
    await appeal.waitFor();
    await s.caption("Open your call and click Appeal this score");
    await s.click(appeal);
    await s.caption("Tick each parameter you dispute and say why");
    for (const [param, why] of DISPUTES) {
      const card = p.locator("div.rounded-lg", { has: p.locator("label", { hasText: param }) });
      await s.click(card.locator('input[type="checkbox"]'));
      await s.type(card.locator("textarea"), why);
    }
    const form = p.locator("div.rounded-xl", { hasText: "Pick the parameters you think the AI got wrong" }).last();
    // The form is longer than the panel: frame the disputed parameters and the submit row.
    await p.locator("div.rounded-lg", { has: p.locator("label", { hasText: DISPUTES[0][0] }) }).evaluate((el) => el.scrollIntoView({ block: "start" }));
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("appeal-form", form, 16, true);
    await s.caption("Review and submit. You can appeal a call once.");
    await s.click(p.getByRole("button", { name: "Review & submit" }));
    await s.click(p.getByRole("button", { name: "Submit appeal" }), 1500);
    await p.getByText("Waiting for a QA to pick it up.").waitFor();
    await s.caption("The dispute now waits for a QA", 2200);
    const status = p.locator("div.rounded-xl", { hasText: "Waiting for a QA to pick it up." }).last();
    await s.page.mouse.move(1300, 20);
    await status.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await s.shot("submitted", status, 16, true);
  },
} satisfies Scenario;
