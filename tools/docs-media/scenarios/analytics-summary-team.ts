import type { Scenario } from "../run.ts";

// A team lead's Summary: their team only, with the workspace average to compare against.
export default {
  name: "analytics-summary-team",
  docsPage: "analytics/review-calls/summary",
  routes: {},
  analytics: { as: "kavya", fixture: "analytics-summary-team" },
  async run(s) {
    await s.goto("/summary");
    await s.page.getByRole("heading", { name: "Team summary" }).waitFor();
    await s.pause(1200);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("team");
  },
} satisfies Scenario;
