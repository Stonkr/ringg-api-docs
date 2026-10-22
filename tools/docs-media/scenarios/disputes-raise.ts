import type { Scenario } from "../run.ts";
import ids from "../fixtures/analytics/ids.json" with { type: "json" };

// An agent finds a call they can still appeal and disputes two parameters.
const DISPUTES: [string, string][] = [
  ["Gave the recording disclosure", "I said the call is recorded right after the greeting, at 0:06. Please listen again."],
  ["Stated the EMI amount and due date", "I told the customer the exact amount and the due date at about 0:20."],
];

export default {
  name: "disputes-raise",
  docsPage: "analytics-platform/disputes/raise-a-dispute",
  title: "Raise a dispute",
  routes: {},
  analytics: { as: "vikram", fixture: "disputes-raise" },
  viewport: { width: 1152, height: 720 },
  async run(s) {
    const p = s.page;
    const rest = () => p.mouse.move(s.viewport.width - 120, 16); // no hover states in the shot
    await s.goto("/interactions");
    await p.getByText(ids.titles.raise).first().waitFor();
    await s.caption("Filter Interactions to calls you can still appeal");
    await s.click(p.getByRole("button", { name: "Filter" }));
    await s.click(p.getByRole("button", { name: "Appeal", exact: true }));
    await s.click(p.getByRole("button", { name: "Can still appeal" }));
    await s.click(p.getByRole("button", { name: "Save", exact: true }), 1500);
    await rest();
    await s.shot("can-still-appeal");

    await s.caption("Open the call");
    await s.click(p.getByText(ids.titles.raise).first(), 1500);
    await s.click(p.getByRole("link", { name: /Open full page/ }), 2000);
    const cta = p.locator("div.rounded-xl", { hasText: "Think the AI got this wrong?" }).last();
    await cta.waitFor();
    await cta.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await rest();
    await s.shot("appeal-button", cta, 12, true);
    await s.caption("Click Appeal this score");
    await s.click(p.getByRole("button", { name: "Appeal this score" }), 1200);

    await s.caption("Tick each parameter you dispute and say why", 1200);
    for (const [param, why] of DISPUTES) {
      const card = p.locator("div.rounded-lg", { has: p.locator("label", { hasText: param }) });
      await s.click(card.locator('input[type="checkbox"]'));
      await s.type(card.locator("textarea"), why);
    }
    const form = p.locator("div.rounded-xl", { hasText: "Pick the parameters you think the AI got wrong" }).last();
    await p.locator("div.rounded-lg", { has: p.locator("label", { hasText: DISPUTES[0][0] }) }).evaluate((el) => el.scrollIntoView({ block: "start" }));
    await rest();
    await s.shot("appeal-form", form, 12, true);

    await s.caption("Click Review & submit, then Submit appeal");
    await s.click(p.getByRole("button", { name: "Review & submit" }), 1200);
    const confirm = p.locator("div.rounded-lg", { hasText: "You can appeal this call only once" }).last();
    await confirm.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await rest();
    await s.shot("confirm", confirm, 12);
    await s.click(p.getByRole("button", { name: "Submit appeal" }), 1500);
    await p.getByText("Waiting for a QA to pick it up.").waitFor();
    const status = p.locator("div.rounded-xl", { hasText: "Waiting for a QA to pick it up." }).last();
    await status.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await s.caption("The appeal waits for a QA. You and your team lead get an email.", 2400);
    await rest();
    await s.shot("submitted", status, 12, true);
  },
} satisfies Scenario;
