import type { Scenario } from "../run.ts";
import { analyticsRoutes } from "../fixtures/monitor-analytics.ts";
import { campaignRoutes } from "../fixtures/campaigns.ts";
import { campaignLogsRoutes } from "../fixtures/campaigns-logs.ts";

export default {
  name: "campaigns-manage",
  docsPage: "campaigns/manage",
  // Analytics and Logs open scoped to the campaign; the campaign list and calls come from the campaigns fixtures.
  routes: { ...analyticsRoutes, ...campaignRoutes, ...campaignLogsRoutes },
  async run(s) {
    const p = s.page;
    const row = (name: RegExp) => p.getByRole("row", { name });
    await p.context().addCookies([{ name: "sidebar:state", value: "false", url: "http://localhost:3201" }]);
    await s.goto("/campaigns");

    await s.caption("A completed campaign can export its call report", 400);
    await s.click(row(/September EMI follow-ups/), 900);
    await s.click(p.getByRole("button", { name: "Export call report" }), 1600);
    await p.keyboard.press("Escape");
    await s.pause(300);

    await s.caption("Open Filters and pick a Status", 400);
    await s.click(p.getByRole("button", { name: "Filters", exact: true }), 600);
    await s.click(p.getByRole("checkbox", { name: "Ongoing" }).locator("xpath=ancestor::label[1]"), 800);
    await p.keyboard.press("Escape");
    await s.pause(600);

    await s.caption("Click a campaign to open its details", 400);
    await s.click(row(/EMI reminders – week 41/), 1100);
    await s.caption("Status, assistant, call time and retries", 1500);
    await s.shot("detail-panel", p.locator("aside").last());

    await s.caption("Analytics: this campaign's calls and outcomes", 400);
    await s.click(p.getByRole("button", { name: "View analytics" }), 2600);
    await p.goBack({ waitUntil: "networkidle" });
    await s.pause(500);
    await s.click(row(/EMI reminders – week 41/), 700);

    await s.caption("Click Manage concurrency", 400);
    await s.click(p.getByRole("button", { name: "Open manage concurrency panel" }), 900);
    await s.caption("Workspace tab: split API calls and campaigns", 400);
    const api = p.getByRole("slider", { name: "API concurrency percentage" });
    await s.hover(api.locator("xpath=ancestor::*[@data-slot=\"slider-thumb\"][1]"), 300);
    await api.focus();
    for (let i = 0; i < 10; i++) {
      await p.keyboard.press("ArrowRight");
      await s.pause(50);
    }
    await s.pause(500);
    await s.caption("Campaigns tab: a share for each ongoing campaign", 400);
    await s.click(p.getByRole("tab", { name: "Campaigns" }), 700);
    const first = p.getByRole("slider", { name: /Overdue accounts – Mumbai/ });
    await first.focus();
    for (let i = 0; i < 10; i++) {
      await p.keyboard.press("ArrowRight");
      await s.pause(50);
    }
    const second = p.getByRole("slider", { name: /EMI reminders – week 41/ });
    await second.focus();
    for (let i = 0; i < 10; i++) {
      await p.keyboard.press("ArrowLeft");
      await s.pause(50);
    }
    await s.pause(400);
    await s.shot("manage-concurrency", p.getByRole("dialog"));
    await s.caption("Click Save (saves the open tab)", 400);
    await s.click(p.getByRole("button", { name: "Save concurrency settings" }), 900);

    await s.caption("Terminate stops all future calls, after a confirm", 400);
    await s.click(p.getByRole("button", { name: "Terminate campaign" }), 1600);
    await s.click(p.getByRole("button", { name: "Cancel terminate campaign" }), 600);

    await s.caption("Click History to see the campaign's calls in Logs", 400);
    await s.click(p.getByRole("button", { name: "View call history" }), 1800);
    await s.caption("Logs, filtered to this campaign", 400);
    await s.hover(p.getByText(/^Campaigns: /).first(), 1300);
    await s.shot("campaign-logs");
  },
} satisfies Scenario;
