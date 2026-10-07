import type { Scenario } from "../run.ts";
import { tourRoutes } from "../fixtures/tour.ts";

const STOPS: [string, string][] = [
  ["Workflows", "Workflows: chain calls, messages and waits"],
  ["Logs", "Logs: every call and chat, with transcripts"],
  ["Campaigns", "Campaigns: call a list of contacts"],
  ["Analytics", "Analytics: volume, connectivity and cost"],
  ["Alerts", "Alerts: get notified when a metric crosses a line"],
  ["Knowledge base", "Knowledge base: documents agents look up"],
  ["Numbers", "Numbers: buy, import and pool numbers"],
  ["Tools", "Tools: shared tools and integrations"],
  ["Settings", "Settings: members, API key and billing"],
];

export default {
  name: "dashboard-tour",
  docsPage: "get-started/overview/dashboard",
  routes: tourRoutes,
  async run(s) {
    const p = s.page;
    await s.goto("/assistants");
    await s.shot("dashboard-shell");
    await s.caption("The sidebar holds every section", 1800);
    await s.hover(p.getByRole("link", { name: "Open Assistants", exact: true }), 300);
    await s.caption("Assistants: create, edit and test agents", 2200);
    for (const [item, caption] of STOPS) {
      await s.click(p.getByRole("link", { name: item === "Settings" ? "Open settings" : `Open ${item}`, exact: true }), 400);
      await s.caption(caption, 2300);
    }
    await s.caption("Search (Cmd+K) jumps to any page, agent or campaign", 300);
    await s.click(p.getByRole("button", { name: "Search" }).first(), 900);
    await p.keyboard.type("pay", { delay: 120 });
    await s.pause(2000);
    await p.keyboard.press("Escape");
    await s.pause(500);
  },
} satisfies Scenario;
