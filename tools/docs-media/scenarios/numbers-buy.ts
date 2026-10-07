import type { Scenario } from "../run.ts";
import { agentRoutes } from "../fixtures/agents.ts";
import { makeNumbersRoutes, showProviderLogos } from "../fixtures/numbers.ts";

export default {
  name: "numbers-buy",
  title: "Buy a number",
  docsPage: "numbers/buy-and-import",
  routes: { ...agentRoutes, ...makeNumbersRoutes() },
  async run(s) {
    const p = s.page;
    await showProviderLogos(p);
    await s.goto("/numbers");
    await p.getByLabel("Workspace numbers table").waitFor();
    await s.caption("Open Numbers and click Add number", 600);
    await s.click(p.getByRole("button", { name: "Add number" }), 1500);
    const dialog = p.getByRole("dialog");
    await dialog.getByLabel("New numbers table").waitFor();
    await s.caption("Pick the provider and account");
    await s.hover(dialog.getByRole("button", { name: "Select Plivo" }), 800);
    await s.hover(dialog.getByRole("button", { name: /Select telephony account/ }), 900);
    await s.caption("Pick the country and region", 600);
    await s.click(dialog.getByRole("button", { name: "Show suggestions" }), 900);
    await s.click(p.locator("li[role=option]", { hasText: /^Karnataka$/ }), 1400);
    await s.shot("buy-new", dialog, 0);
    await s.caption("Click Buy Number on the number you want", 600);
    await s.click(dialog.getByRole("button", { name: "Buy number 919876543231" }), 1000);
    await s.caption("Confirm with Buy Number", 600);
    await s.shot("confirm-buy", p.getByRole("dialog").filter({ hasText: "Are you sure you want to buy" }), 0);
    await s.click(p.getByRole("button", { name: "Confirm purchase" }), 1600);
    await s.caption("The number appears in All Numbers");
    await s.hover(p.getByRole("row").filter({ hasText: "+919876543231" }), 1800);
  },
} satisfies Scenario;
