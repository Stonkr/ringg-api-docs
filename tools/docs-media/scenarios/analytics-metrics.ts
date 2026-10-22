import type { Scenario } from "../run.ts";

export default {
  name: "analytics-metrics",
  docsPage: "analytics-platform/set-up/metrics",
  routes: {},
  analytics: { as: "priya", fixture: "analytics-metrics" },
  async run(s) {
    const p = s.page;
    await s.goto("/rubrics");
    await p.getByText("EMI collections").first().waitFor();
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("use-cases");
    await p.getByText("EMI collections").first().click();
    await s.pause(1500);
    await s.page.mouse.move(1300, 20);
    await s.shot("scorecard");
  },
} satisfies Scenario;
