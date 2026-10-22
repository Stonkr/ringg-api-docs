import type { Scenario } from "../run.ts";
import ids from "../fixtures/analytics/ids.json" with { type: "json" };

// A QA's review next to the AI's scoring on one call.
export default {
  name: "analytics-qa-reviews",
  docsPage: "analytics/review-calls/qa-reviews",
  routes: {},
  analytics: { as: "dev", fixture: "analytics-qa-reviews" },
  async run(s) {
    await s.goto(`/interactions/${ids.calls.qaReviewed}`);
    await s.page.getByText("Transcript", { exact: true }).first().waitFor();
    await s.pause(1500);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("review");
  },
} satisfies Scenario;
