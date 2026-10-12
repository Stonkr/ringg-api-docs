import type { Scenario } from "../run.ts";
import { agentRoutes } from "../fixtures/agents.ts";
import { showProviderLogos } from "../fixtures/numbers.ts";
import { makeTelephonyRoutes } from "../fixtures/telephony.ts";

export default {
  name: "telephony-sip",
  title: "Connect a SIP trunk",
  docsPage: "telephony/sip-integration",
  routes: { ...agentRoutes, ...makeTelephonyRoutes() },
  async run(s) {
    const p = s.page;
    await showProviderLogos(p);
    await s.goto("/numbers");
    await p.getByLabel("Workspace numbers table").waitFor();
    const dialog = p.getByRole("dialog");
    const field = (name: string) => dialog.getByRole("textbox", { name });
    const option = (text: RegExp) => p.locator('[role="option"]').filter({ hasText: text }).locator("visible=true").first();
    // The form sits in a scrollable card; shots crop to it so they show what the viewer sees.
    const card = () => dialog.getByRole("button", { name: "Save SIP trunk" }).locator("xpath=ancestor::div[contains(@class,'overflow-auto')][1]");

    await s.caption("Open Numbers and click Add number", 500);
    await s.click(p.getByRole("button", { name: "Add number" }), 1200);
    await s.shot("provider-selection", dialog, 0);
    await s.caption("Select SIP in the provider list", 400);
    await s.click(dialog.getByRole("button", { name: "Select SIP" }), 1000);
    await s.caption("Click the gear to open Configure SIP Trunks", 400);
    await s.click(dialog.getByRole("button", { name: "Configure provider" }), 1200);
    await s.caption("Click Add", 300);
    await s.click(dialog.getByRole("button", { name: "Add", exact: true }), 800);

    await s.caption("Name the trunk and set Direction to Both", 300);
    await s.type(field("Display name"), "Acme PBX Mumbai");
    await s.click(dialog.locator('button[aria-label="Direction"]'), 500);
    await s.click(option(/^Both$/), 500);

    await s.caption("Add the IPs or CIDRs your INVITEs come from", 300);
    await s.type(field("Inbound sources"), "203.0.113.0/28");
    await s.click(dialog.getByRole("button", { name: "Add inbound source" }), 500);

    await s.caption("Set the outbound target, tech prefix and strip digits", 300);
    await s.type(field("Outbound target"), "sip.acme-lending.example:5061");
    await s.type(field("Tech prefix"), "9");
    await s.type(field("Strip digits"), "1");

    await s.caption("Choose the transport", 300);
    await s.click(dialog.locator('button[aria-label="Transport"]'), 500);
    await s.click(option(/^TLS$/), 500);
    await field("Display name").locator("xpath=ancestor::div[contains(@class,'grid')][1]").evaluate((el) => el.scrollIntoView({ block: "start" }));
    await s.pause(400);
    await s.shot("trunk-form", card(), 0);

    await s.caption("Turn on Authentication and enter the credentials", 300);
    const authSwitch = dialog.getByRole("switch", { name: "Toggle authentication" });
    await s.click(authSwitch, 600);
    await s.type(field("Auth username"), "ringg-trunk");
    await s.type(field("Auth password"), "Acme#2026-example");
    await s.type(field("Auth realm"), "sip.acme-lending.example");
    await s.type(field("Expires (seconds)"), "1800");
    await s.type(field("Register delay (seconds)"), "5");
    // The auth box is taller than the card: show Auth mode through Register delay (the toggle scrolls off the top).
    await field("Register delay (seconds)").evaluate((el) => el.closest('[data-slot="base"]')!.scrollIntoView({ block: "end" }));
    await s.pause(400);
    await s.shot("trunk-auth", card(), 0);

    await s.caption("Click Save", 300);
    await s.click(dialog.getByRole("button", { name: "Save SIP trunk" }), 1200);
    await s.caption("The trunk is listed; edit or delete it from here", 300);
    await s.hover(dialog.getByRole("row").filter({ hasText: "Acme PBX Mumbai" }), 1000);
    await s.shot("trunk-list", dialog.getByLabel("SIP trunks table"), 8);

    await s.caption("Close the panel: Add custom takes the trunk's numbers", 300);
    await s.click(dialog.getByRole("button", { name: "Close SIP trunk settings" }), 700);
    await s.click(dialog.locator('button[aria-label="Select telephony account"]'), 500);
    await s.click(option(/^Acme PBX Mumbai$/), 600);
    await s.hover(dialog.getByRole("tab", { name: "Add custom" }), 1500);
  },
} satisfies Scenario;
