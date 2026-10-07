import type { Scenario } from "../run.ts";
import { membersRoutes } from "../fixtures/account.ts";

export default {
  name: "account-members",
  docsPage: "account/members",
  routes: membersRoutes(),
  async run(s) {
    const p = s.page;
    await s.goto("/settings/members");
    await s.caption("Settings → Workspace members lists everyone");
    await s.caption("Open the invite dialog", 600);
    await s.click(p.getByRole("button", { name: "Invite member" }), 1000);
    const dialog = p.getByRole("dialog", { name: "Invite member" });
    await s.caption("Enter the email", 400);
    await s.type(dialog.getByRole("textbox", { name: "Email" }), "ananya.rao@acme-lending.example");
    await s.caption("Choose permissions", 400);
    await s.click(dialog.getByRole("button", { name: /Permissions for the new member/ }), 700);
    await s.click(p.getByRole("option", { name: "Assistants" }), 400);
    await s.click(p.getByRole("option", { name: "Campaigns" }), 600);
    await p.keyboard.press("Escape");
    await s.pause(600);
    await s.shot("invite-dialog", dialog, 24);
    await s.caption("Send: click Invite Member", 400);
    await s.click(dialog.getByRole("button", { name: "Send invitation" }), 1200);
    await s.caption("The new member appears as Pending", 1800);
    await s.caption("Change anyone's access from their row", 400);
    await s.click(p.getByRole("button", { name: /Permissions for Kavya Iyer/ }), 900);
    await s.click(p.getByRole("option", { name: "Knowledge Base" }), 500);
    await s.click(p.getByRole("option", { name: "Numbers" }), 900);
    await p.keyboard.press("Escape");
    await s.pause(900);

    await s.goto("/settings/company-details");
    await s.caption("Company details holds your KYC for billing", 2200);
    await s.shot("company-details", p.locator("main section").first(), 0);

    await s.goto("/settings/workspace-logs");
    await s.caption("Workspace logs: who changed what, and when", 2200);
    await s.hover(p.getByText("Edited workspace user").first(), 1200);
    await s.shot("workspace-logs", p.locator("main section").first(), 0);
  },
} satisfies Scenario;
