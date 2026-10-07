import type { Scenario } from "../run.ts";
import { billingRoutes } from "../fixtures/account.ts";

export default {
  name: "account-billing",
  docsPage: "account/billing",
  routes: billingRoutes(),
  async run(s) {
    const p = s.page;
    await s.goto("/settings/billing-plan");
    await s.caption("The Plan tab: balance, concurrency and rates", 2200);
    await s.shot("plan-tab", p.locator("main section").first(), 0);

    await s.caption("Click Add Balance and enter an amount", 500);
    await s.click(p.getByRole("button", { name: "Add balance" }), 900);
    await s.type(p.getByLabel("Credits amount"), "5000");
    await s.caption("GST is added; Proceed to Pay opens checkout", 2000);
    await s.shot("add-balance", p.getByRole("dialog"), 24);
    await p.keyboard.press("Escape");
    await s.pause(700);

    await s.caption("Redeem a coupon", 500);
    await s.click(p.getByRole("button", { name: "Redeem coupon" }).first(), 900);
    await s.type(p.getByLabel("Coupon code"), "WELCOME500");
    await s.click(p.getByRole("dialog").getByRole("button", { name: "Redeem coupon" }), 2400);

    await s.caption("Click Change concurrency and pick a value", 500);
    await s.click(p.getByRole("button", { name: "Change concurrency" }), 900);
    const slider = p.getByRole("slider");
    await s.hover(slider, 300);
    await slider.focus();
    for (let i = 0; i < 5; i++) {
      await p.keyboard.press("ArrowRight");
      await s.pause(250);
    }
    await s.pause(800);
    await s.shot("change-concurrency", p.getByRole("dialog"), 24);
    await s.caption("Click Update, then Confirm", 500);
    await s.click(p.getByRole("button", { name: "Update concurrency" }), 900);
    await s.click(p.getByRole("button", { name: "Confirm concurrency update" }), 2200);

    await s.caption("Transactions lists every payment", 500);
    await s.click(p.getByRole("tab", { name: "Transactions" }), 1200);
    await s.hover(p.getByRole("button", { name: "Download receipt" }).first(), 1500);
    await s.caption("A failed payment added nothing; pay again", 400);
    await s.hover(p.getByText("failed", { exact: true }).first(), 1600);
  },
} satisfies Scenario;
