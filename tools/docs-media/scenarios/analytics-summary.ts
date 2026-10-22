import type { Scenario } from "../run.ts";

export default {
  name: "analytics-summary",
  docsPage: "analytics-platform/review-calls/summary",
  routes: {},
  analytics: { as: "priya", fixture: "analytics-summary" },
  async run(s) {
    await s.goto("/summary");
    await s.page.getByRole("heading", { name: "Summary" }).waitFor();
    await s.pause(1200);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("workspace");
  },
} satisfies Scenario;
