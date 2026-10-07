import type { Scenario } from "../run.ts";
import { agentRoutes } from "../fixtures/agents.ts";
import { makeNumbersRoutes, showProviderLogos } from "../fixtures/numbers.ts";

export default {
  name: "numbers-import",
  title: "Import a number",
  docsPage: "numbers/buy-and-import",
  routes: { ...agentRoutes, ...makeNumbersRoutes() },
  async run(s) {
    const p = s.page;
    await showProviderLogos(p);
    await s.goto("/numbers");
    await p.getByLabel("Workspace numbers table").waitFor();
    await s.caption("Click Add number and select your provider", 600);
    await s.click(p.getByRole("button", { name: "Add number" }), 1300);
    const dialog = p.getByRole("dialog");
    await s.click(dialog.getByRole("button", { name: "Select Exotel" }), 1200);
    await s.caption("Click the gear to configure provider accounts", 600);
    await s.click(dialog.getByRole("button", { name: "Configure provider" }), 1400);
    await s.caption("Click Add to connect another account", 600);
    await s.click(dialog.getByRole("button", { name: "Add BYOT account" }), 1000);
    await s.caption("Enter a name and the provider's credentials", 400);
    await s.type(dialog.getByLabel(/^Name/), "Exotel Pune");
    await s.type(dialog.getByLabel(/^SID/), "acme2");
    await s.type(dialog.getByLabel(/^API Key/), "k8f2a1");
    await s.type(dialog.getByLabel(/^API Token/), "t5c9e0");
    await s.type(dialog.getByLabel(/^App ID/), "104821");
    await s.type(dialog.getByLabel(/^Subdomain/), "api.exotel.com");
    await s.shot("provider-form", dialog, 0);
    await s.caption("Click Save", 500);
    await s.click(dialog.getByRole("button", { name: "Save and test BYOT" }), 1600);
    await s.hover(dialog.getByLabel("BYOT accounts table"), 1200);
    await s.caption("Close the panel and open Import your own", 500);
    await s.click(dialog.getByRole("button", { name: "Close BYOT settings" }), 1000);
    await s.click(dialog.getByRole("tab", { name: "Import your own" }), 1500);
    await s.shot("import-your-own", dialog, 0);
    await s.caption("Click Import on a number, then confirm", 600);
    await s.click(dialog.getByRole("button", { name: "Import number 919876544321" }), 1000);
    await s.click(p.getByRole("button", { name: "Confirm import" }), 1600);
    await s.caption("The imported number appears in All Numbers");
    await s.hover(p.getByRole("row").filter({ hasText: "+919876544321" }), 1800);
  },
} satisfies Scenario;
