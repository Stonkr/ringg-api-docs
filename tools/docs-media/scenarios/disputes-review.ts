import type { Scenario } from "../run.ts";
import ids from "../fixtures/analytics/ids.json" with { type: "json" };

// A QA takes an appeal from the queue, re-scores it and resolves it.
const DISPUTED = "Stated the EMI amount and due date";

export default {
  name: "disputes-review",
  docsPage: "analytics-platform/disputes/review-a-dispute",
  title: "Review a dispute",
  routes: {},
  analytics: { as: "farah", fixture: "disputes-review" },
  viewport: { width: 1152, height: 720 },
  async run(s) {
    const p = s.page;
    const rest = () => p.mouse.move(s.viewport.width - 120, 16); // no hover states in the shot
    await s.goto("/interactions");
    await p.getByText(ids.titles.appeal_meera).first().waitFor();
    await s.caption("Filter Interactions to appeals waiting for review");
    await s.click(p.getByRole("button", { name: "Filter" }));
    await s.click(p.getByRole("button", { name: "Appeal", exact: true }));
    await s.click(p.getByRole("button", { name: "Waiting for review" }));
    await s.click(p.getByRole("button", { name: "Save", exact: true }), 1500);
    await rest();
    await s.shot("queue");

    await s.caption("Open the oldest appeal");
    await s.click(p.getByText(ids.titles.appeal_meera).first(), 1500);
    await s.click(p.getByRole("link", { name: /Open full page/ }), 2000);
    const start = p.getByRole("button", { name: "Start review" });
    await start.waitFor();
    const status = p.locator("div.rounded-xl", { has: start }).last();
    await status.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await rest();
    await s.shot("start-review", status, 12, true);
    await s.caption("Click Start review to claim it");
    await s.click(start, 1500);

    await p.getByText(/Disputed by the agent/).waitFor();
    const form = p.locator("div.rounded-xl", { has: p.getByText(/Disputed by the agent/) }).last();
    await form.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await s.caption("Read the agent's reason, then rate the parameter and add a remark", 2400);
    const card = p.locator("div.rounded-lg", { hasText: DISPUTED }).filter({ has: p.locator("textarea") }).first();
    await s.click(card.getByRole("button", { name: "Yes", exact: true }));
    await s.type(card.locator("textarea"), "Re-listened: the amount and due date are stated at 0:21.");
    await s.caption("Keep the AI's ratings for everything nobody disputed");
    await s.click(p.getByRole("button", { name: /Keep AI ratings for/ }), 1500);
    await p.getByText("Ready to submit.").waitFor();
    await form.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await rest();
    await s.shot("review-form", form, 12, true);

    await s.caption("Click Resolve appeal, then Submit final score");
    await s.click(p.getByRole("button", { name: "Resolve appeal" }), 1200);
    const confirm = p.locator("div", { hasText: /^Your score replaces the AI score everywhere/ }).last();
    const confirmBox = p.locator("div.rounded-lg", { has: p.getByRole("button", { name: "Submit final score" }) }).last();
    await confirmBox.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await confirm.waitFor().catch(() => {});
    await rest();
    await s.shot("resolve-confirm", confirmBox, 12, true);
    await s.click(p.getByRole("button", { name: "Submit final score" }), 1800);

    await p.getByText("Final score · Appeal reviewed by QA").waitFor();
    await s.caption("The QA score is now the call's official score", 2400);
    // Frame the analytics column from the final-score card down.
    await p.getByText("Final score · Appeal reviewed by QA").evaluate((el) => {
      let q = el.parentElement;
      while (q && !/(auto|scroll)/.test(getComputedStyle(q).overflowY)) q = q.parentElement;
      q?.setAttribute("data-docs-shot", "analytics");
      el.closest(".rounded-xl")?.scrollIntoView({ block: "start" });
    });
    await rest();
    await s.shot("final-score", p.locator('[data-docs-shot="analytics"]'), 0);
  },
} satisfies Scenario;
