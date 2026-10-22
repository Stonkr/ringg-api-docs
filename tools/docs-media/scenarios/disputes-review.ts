import type { Scenario } from "../run.ts";
import ids from "../fixtures/analytics/ids.json" with { type: "json" };

// A QA takes a dispute from the queue, re-scores it and resolves it.
const DISPUTED = "Stated the EMI amount and due date";

export default {
  name: "disputes-review",
  docsPage: "disputes/review-a-dispute",
  title: "Review a dispute",
  routes: {},
  analytics: { as: "farah", fixture: "disputes-review" },
  async run(s) {
    const p = s.page;
    await s.goto("/interactions?appeal=submitted");
    await p.getByText("Waiting for review").first().waitFor();
    await s.caption("Filter Interactions to appeals waiting for review", 2000);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("queue");
    await s.goto(`/interactions/${ids.calls.appeal_meera}`);
    const start = p.getByRole("button", { name: "Start review" });
    await start.waitFor();
    await s.caption("Open the call and click Start review to claim it");
    await s.click(start, 1500);
    await p.getByText(/Disputed by the agent/).waitFor();
    await s.caption("Rate each disputed parameter and add a remark");
    const card = p.locator("div.rounded-lg", { hasText: DISPUTED }).filter({ has: p.locator("textarea") }).first();
    await s.click(card.getByRole("button", { name: "Yes", exact: true }));
    await s.type(card.locator("textarea"), "Re-listened: the amount and due date are stated at 0:21.");
    await s.caption("Keep the AI's ratings for everything nobody disputed");
    await s.click(p.getByRole("button", { name: /Keep AI ratings for/ }), 1500);
    await p.getByText("Ready to submit.").waitFor();
    const form = p.locator("div.rounded-xl", { has: p.getByText(/Disputed by the agent/) }).last();
    await s.page.mouse.move(1300, 20);
    await form.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await s.shot("review-form", form, 16, true);
    await s.caption("Resolve the appeal. Its score becomes the call's score.");
    await s.click(p.getByRole("button", { name: "Resolve appeal" }));
    await s.click(p.getByRole("button", { name: "Submit final score" }), 1500);
    await p.getByText("Final score · Appeal reviewed by QA").waitFor();
    await s.pause(1800);
    const result = p.locator("div.rounded-xl", { hasText: "Final score · Appeal reviewed by QA" }).last();
    await s.page.mouse.move(1300, 20);
    await result.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await s.shot("final-score", result, 16, true);
  },
} satisfies Scenario;
