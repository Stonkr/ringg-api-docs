import type { Scenario } from "../run.ts";
import ids from "../fixtures/analytics/ids.json" with { type: "json" };

export default {
  name: "analytics-interactions",
  docsPage: "analytics/review-calls/interactions",
  routes: {},
  analytics: { as: "priya", fixture: "analytics-interactions" },
  async run(s) {
    const p = s.page;
    await s.goto("/interactions");
    await p.getByText(ids.calls.mixed ? "Missed EMI follow-up" : "EMI reminder").first().waitFor();
    await s.pause(1000);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("list");
    await s.goto(`/interactions/${ids.calls.mixed}`);
    await p.getByText("Transcript", { exact: true }).first().waitFor();
    await s.pause(1500);
    await s.page.mouse.move(1300, 20);
    await s.shot("call-page");
  },
} satisfies Scenario;
