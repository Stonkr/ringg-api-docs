import type { Scenario } from "../run.ts";

// The agent's own report card, with a coaching note to read.
export default {
  name: "analytics-report-card-agent",
  docsPage: "analytics/coach-agents/report-cards",
  routes: {},
  analytics: { as: "arjun", fixture: "analytics-report-card-agent" },
  async run(s) {
    await s.goto("/report");
    await s.page.getByRole("heading", { name: "My report card" }).waitFor();
    await s.pause(1500);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("my-report");
  },
} satisfies Scenario;
