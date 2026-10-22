import type { Scenario } from "../run.ts";

// Dispute settings and the dispute report, as an admin.
export default {
  name: "disputes-settings",
  docsPage: "analytics-platform/disputes/settings-and-reports",
  routes: {},
  analytics: { as: "priya", fixture: "disputes-settings" },
  async run(s) {
    const p = s.page;
    await s.goto("/settings");
    await p.getByText("Appeal window").first().waitFor();
    await s.pause(800);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("settings", p.getByText("Appeal window").first().locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]"));
    await s.goto("/analytics");
    const report = p.locator("div.summary-card", { has: p.getByText("Disputed AI scores") });
    await report.waitFor();
    await report.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await s.pause(1500);
    await s.page.mouse.move(1300, 20);
    await s.shot("report", report, 16, true);
  },
} satisfies Scenario;
