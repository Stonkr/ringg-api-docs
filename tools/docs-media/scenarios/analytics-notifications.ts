import type { Scenario } from "../run.ts";

export default {
  name: "analytics-notifications",
  docsPage: "analytics-platform/set-up/notifications",
  routes: {},
  analytics: { as: "priya", fixture: "analytics-notifications" },
  async run(s) {
    const p = s.page;
    await s.goto("/notifications");
    await p.getByText("Share QA reviews with the agent").waitFor();
    await s.pause(800);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("triggers");
    await p.getByText("Share QA reviews with the agent").click();
    await p.getByText("What starts it?").waitFor();
    await s.pause(1500);
    await s.page.mouse.move(1300, 20);
    await s.shot("qa-trigger");
  },
} satisfies Scenario;
