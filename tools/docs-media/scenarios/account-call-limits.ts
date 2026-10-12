import type { Scenario } from "../run.ts";
import { callLimitRoutes } from "../fixtures/account.ts";

export default {
  name: "account-call-limits",
  docsPage: "account/call-limits",
  routes: callLimitRoutes(),
  async run(s) {
    const p = s.page;
    await s.goto("/settings/call-frequency");
    await s.caption("Open Settings → Call limits");
    await s.caption("Turn it on", 400);
    await s.click(p.locator("label").filter({ hasText: "Limit how often one person is called" }).first(), 900);
    await s.caption("Set the maximum calls to one person", 400);
    const input = p.getByRole("textbox", { name: "Maximum calls to one person" });
    await s.click(input, 300);
    await p.keyboard.press("ControlOrMeta+a");
    await p.keyboard.type("3", { delay: 80 });
    await p.keyboard.press("Tab");
    await s.pause(900);
    await s.caption("Choose the rolling window", 400);
    await s.click(p.getByRole("button", { name: /Rolling window/ }), 900);
    await s.click(p.getByRole("option", { name: "24 hours" }), 900);
    await s.caption("Check the projected impact", 400);
    await s.hover(p.getByRole("heading", { name: "Projected impact" }), 1800);
    await s.shot("call-limit-form", p.locator("main section .grid").first(), 8);
    await s.click(p.getByRole("button", { name: "See an example of how the call limit applies" }), 2400);
    await p.keyboard.press("Escape");
    await s.pause(600);
    await s.caption("Click Save, then Save limit", 400);
    await s.click(p.getByRole("button", { name: "Save call limit" }), 1000);
    await s.shot("confirm-dialog", p.getByRole("dialog", { name: "This affects calls already queued" }), 24);
    await s.click(p.getByRole("button", { name: "Save the call limit and apply it to queued calls" }), 2400);
  },
} satisfies Scenario;
