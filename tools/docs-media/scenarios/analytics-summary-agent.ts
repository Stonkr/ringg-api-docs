import type { Scenario } from "../run.ts";

// An agent's Summary: their own calls only.
export default {
  name: "analytics-summary-agent",
  docsPage: "analytics-platform/review-calls/summary",
  routes: {},
  analytics: { as: "arjun", fixture: "analytics-summary-agent" },
  async run(s) {
    await s.goto("/summary");
    await s.page.getByRole("heading", { name: "My summary" }).waitFor();
    await s.pause(1200);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("agent");
  },
} satisfies Scenario;
