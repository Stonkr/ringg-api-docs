import type { Scenario } from "../run.ts";
import ids from "../fixtures/analytics/ids.json" with { type: "json" };

// A resolved dispute that a QA corrected later, as the QA sees it.
export default {
  name: "disputes-corrections",
  docsPage: "analytics-platform/disputes/results-and-corrections",
  routes: {},
  analytics: { as: "farah", fixture: "disputes-corrections" },
  async run(s) {
    await s.goto(`/interactions/${ids.calls.appeal_arjun_corrected}`);
    await s.page.getByText("Final score · Appeal reviewed by QA").waitFor();
    await s.pause(1500);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    // Frame the analytics column (it scrolls on its own) from the final-score card down.
    await s.page.getByText("Final score · Appeal reviewed by QA").evaluate((el) => {
      let p = el.parentElement;
      while (p && !/(auto|scroll)/.test(getComputedStyle(p).overflowY)) p = p.parentElement;
      p?.setAttribute("data-docs-shot", "analytics");
      el.closest(".rounded-xl")?.scrollIntoView({ block: "start" });
    });
    await s.shot("corrected", s.page.locator('[data-docs-shot="analytics"]'), 0);
  },
} satisfies Scenario;
