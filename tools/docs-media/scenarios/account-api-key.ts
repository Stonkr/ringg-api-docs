import type { Scenario } from "../run.ts";
import { apiKeyRoutes } from "../fixtures/account.ts";

export default {
  name: "account-api-key",
  docsPage: "account/api-key",
  routes: apiKeyRoutes(),
  async run(s) {
    const p = s.page;
    await p.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await s.goto("/settings/api-key");
    await s.caption("Open Settings → API key", 2400);
    await s.caption("Click Generate API Key", 500);
    await s.click(p.getByRole("button", { name: "Generate API key" }), 1200);
    const dialog = p.getByRole("dialog");
    await s.caption("The full key is shown only once", 1800);
    await s.caption("Copy it now and store it safely", 500);
    await s.click(dialog.getByRole("button", { name: "Copy API key" }), 900);
    await s.hover(dialog.getByText("Copy and store this API key now"), 1600);
    await s.shot("key-reveal", dialog, 24);
    await s.caption("Click Done to close the dialog", 500);
    await s.click(dialog.getByRole("button", { name: /^Done/ }), 1200);
    await s.caption("The page now shows the masked key and date", 1200);
    await s.hover(p.getByText("Generated key"), 2400);
    await s.shot("key-masked", p.getByRole("button", { name: "Regenerate API key" }).locator("xpath=../.."), 24);
    await s.caption("To rotate, Regenerate revokes the old key at once", 400);
    await s.click(p.getByRole("button", { name: "Regenerate API key" }), 2000);
    await s.click(p.getByRole("button", { name: "Cancel regeneration" }), 800);
  },
} satisfies Scenario;
