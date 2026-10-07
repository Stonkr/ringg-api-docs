import type { Scenario } from "../run.ts";
import { agentRoutes } from "../fixtures/agents.ts";
import { makeNumbersRoutes } from "../fixtures/numbers.ts";

export default {
  name: "numbers-pools",
  docsPage: "numbers/pools",
  routes: { ...agentRoutes, ...makeNumbersRoutes() },
  async run(s) {
    const p = s.page;
    await s.goto("/numbers?channel=phone&tab=pools");
    await p.getByRole("button", { name: "Open pool India Outbound" }).waitFor();
    await s.caption("Open Number Pools and click Add pool", 600);
    await s.click(p.getByRole("button", { name: "Add new pool" }), 1200);
    const dialog = p.getByRole("dialog");
    await s.caption("Name the pool", 400);
    await s.type(dialog.getByLabel("Pool name"), "Renewals");
    await s.type(dialog.getByLabel("Pool description"), "Outbound campaigns");
    await s.caption("Add numbers to the pool", 600);
    await s.click(dialog.getByRole("button", { name: /Add numbers to pool/ }), 1000);
    await s.click(p.locator("li[role=option]", { hasText: "+919876541205" }), 600);
    await s.click(p.locator("li[role=option]", { hasText: "+919876541206" }), 900);
    await s.click(dialog.getByText("Create pool", { exact: true }).first(), 700);
    await s.caption("Turn on Auto purchase and pick a country", 600);
    await s.click(dialog.getByRole("switch"), 900);
    await s.click(dialog.getByRole("button", { name: "Auto purchase replacement country" }), 900);
    await s.click(p.locator("li[role=option]", { hasText: /^India$/ }), 900);
    await s.shot("create-pool", dialog, 0);
    await s.caption("Click Create pool", 500);
    await s.click(dialog.getByRole("button", { name: "Create pool", exact: true }), 1800);
    await s.caption("Your new pool appears as a card");
    await s.shot("pool-list", p.locator("main"));
    await s.caption("Click a card to open the pool page", 500);
    await s.click(p.getByRole("button", { name: "Open pool Renewals" }), 1800);
    await p.getByLabel("Numbers in Renewals").waitFor();
    await s.caption("Manage numbers, tags and Auto purchase here");
    await s.shot("pool-detail", p.locator("main"));
    await s.caption("Add more numbers from the pool page", 300);
    await s.click(p.getByRole("button", { name: "Add number to pool" }), 1000);
    await s.click(p.locator('input[type="checkbox"][aria-label="Select +919876541204"]'), 500);
    await s.click(p.getByRole("button", { name: "Add selected numbers to pool" }), 1300);
    await s.caption("A spam-flagged number is skipped in rotation", 300);
    await s.click(p.getByRole("button", { name: "Back to pools" }), 1000);
    await s.click(p.getByRole("button", { name: "Open pool India Outbound" }), 1300);
    await s.hover(p.getByRole("row").filter({ hasText: "+919876541202" }).getByText("Spam", { exact: true }), 1800);
  },
} satisfies Scenario;
