import type { Scenario } from "../run.ts";

export default {
  name: "analytics-agents",
  docsPage: "analytics/coach-agents/agents-and-teams",
  routes: {},
  analytics: { as: "priya", fixture: "analytics-agents" },
  async run(s) {
    const p = s.page;
    await s.goto("/agents");
    await p.getByText("Neha Kapoor").first().waitFor();
    await s.pause(1000);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("table");
    await p.getByLabel("Org Chart").click();
    await s.pause(1500);
    await s.page.mouse.move(1300, 20);
    await s.shot("org-chart");
  },
} satisfies Scenario;
