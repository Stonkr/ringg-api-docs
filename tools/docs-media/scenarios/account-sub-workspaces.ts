import type { Scenario } from "../run.ts";
import { subWorkspaceRoutes } from "../fixtures/account.ts";

export default {
  name: "account-sub-workspaces",
  docsPage: "account/sub-workspaces",
  routes: subWorkspaceRoutes(),
  async run(s) {
    const p = s.page;
    await s.goto("/settings/workspaces");
    await s.caption("Settings → Sub-workspaces, on the primary", 2200);
    await s.shot("sub-workspaces", p.locator("main section").first(), 0);
    await s.caption("Click New sub-workspace", 400);
    await s.click(p.getByRole("button", { name: "Create sub-workspace" }), 900);
    await s.caption("Name it", 400);
    await s.type(p.getByRole("textbox", { name: /^Name/ }), "Acme Retail");
    await s.shot("create-dialog", p.getByRole("dialog"), 24);
    await s.caption("Click Create sub-workspace", 400);
    await s.click(p.getByRole("button", { name: "Confirm create sub-workspace" }), 1800);
    await s.caption("Click Manage to allocate concurrency", 400);
    await s.click(p.getByRole("button", { name: "Manage Acme Retail" }), 1200);
    const drawer = p.getByRole("dialog");
    const increment = drawer.getByRole("button", { name: /Increase/ });
    for (let i = 0; i < 5; i++) await s.click(increment, 250);
    await drawer.getByRole("heading", { name: "Reserve concurrency" }).click();
    await s.pause(600);
    await s.shot("allocate-concurrency", drawer.getByRole("heading", { name: "Reserve concurrency" }).locator("xpath=../.."), 24);
    await s.caption("Click Save concurrency", 400);
    await s.click(drawer.getByRole("button", { name: "Save concurrency" }), 1600);

    await s.caption("Billing: move part of the balance to it", 400);
    await s.click(drawer.getByRole("tab", { name: "Billing" }), 1000);
    const balance = drawer.getByRole("textbox", { name: "Balance for Acme Retail" });
    await s.click(balance, 200);
    await p.keyboard.press("ControlOrMeta+a");
    await p.keyboard.type("2000", { delay: 80 });
    await p.keyboard.press("Tab");
    await s.pause(800);
    await s.click(drawer.getByRole("button", { name: "Save balances" }), 1500);

    await s.caption("Members: invite someone to this sub-workspace only", 400);
    await s.click(drawer.getByRole("tab", { name: "Members" }), 900);
    await s.type(drawer.getByPlaceholder("name@company.com"), "sana.qureshi@acme-lending.example");
    await s.click(drawer.getByRole("button", { name: "Send invitation" }), 1800);
    await s.click(drawer.getByRole("button", { name: /close/i }).first(), 700);

    await s.caption("People shows everyone's access across the family", 400);
    await s.click(p.getByRole("tab", { name: "People" }), 2400);
  },
} satisfies Scenario;
