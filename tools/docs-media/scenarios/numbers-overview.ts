import type { Scenario } from "../run.ts";
import { agentRoutes } from "../fixtures/agents.ts";
import { makeNumbersRoutes } from "../fixtures/numbers.ts";

export default {
  name: "numbers-overview",
  title: "Numbers",
  docsPage: "numbers/overview",
  routes: { ...agentRoutes, ...makeNumbersRoutes() },
  async run(s) {
    const p = s.page;
    await s.goto("/numbers");
    await p.getByLabel("Workspace numbers table").waitFor();
    await s.caption("Numbers lives under Inventory in the sidebar");
    await s.shot("all-numbers", p.locator("main"));
    await s.caption("All Numbers lists every number in the workspace", 800);
    await s.hover(p.getByLabel("Workspace numbers table"), 1200);
    await s.caption("Test numbers are for trial calls only", 600);
    await s.hover(p.getByRole("row").filter({ hasText: "+919876540000" }).getByText("Test number"), 1600);
    await s.caption("A Spam chip marks a flagged number; hover for why", 600);
    await s.hover(p.getByRole("row").filter({ hasText: "+919876541202" }).getByText("Spam", { exact: true }), 1800);
    await s.shot("spam-chip", p.getByRole("row").filter({ hasText: "+919876541202" }), 60);
    await s.caption("Tag numbers by team, region or purpose", 400);
    await s.click(p.getByRole("button", { name: "Add tags for +919876541203" }), 900);
    await s.type(p.getByRole("textbox", { name: "Enter new tag" }), "inbound");
    await s.click(p.getByRole("button", { name: "Add new tags" }), 1100);
    await s.click(p.getByRole("dialog").getByRole("button", { name: "Close" }), 500);
    await s.caption("Filter by telephony account", 600);
    await s.click(p.getByRole("button", { name: /Select telephony account/ }), 1000);
    await s.click(p.getByRole("option", { name: "Exotel Mumbai" }), 1400);
    await s.click(p.getByRole("button", { name: /Select telephony account/ }), 700);
    await s.click(p.getByRole("option", { name: "All" }), 1000);
    await s.caption("Number Pools groups numbers for rotation", 600);
    await s.click(p.getByRole("tab", { name: "Number Pools" }), 1600);
    await s.shot("number-pools", p.locator("main"));
    await s.caption("WhatsApp Business numbers have their own tab", 400);
    await s.click(p.getByRole("tab", { name: "WhatsApp" }), 2200);
  },
} satisfies Scenario;
