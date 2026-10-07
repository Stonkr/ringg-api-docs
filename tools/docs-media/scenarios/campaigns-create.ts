import type { Scenario } from "../run.ts";
import { campaignRoutes, CSV_PATH } from "../fixtures/campaigns.ts";

export default {
  name: "campaigns-create",
  docsPage: "campaigns/create",
  routes: { ...campaignRoutes },
  async run(s) {
    const p = s.page;
    const ac = (label: string) => p.locator(`[data-slot=autocomplete-trigger]:has(button[aria-label="${label}"])`);
    const sel = (label: string) => p.locator(`[data-slot=select-trigger][aria-label="${label}"]`);
    await p.context().addCookies([{ name: "sidebar:state", value: "false", url: "http://localhost:3201" }]);
    await s.goto("/campaigns");
    await s.caption("Click Create campaign", 500);
    await s.click(p.getByRole("button", { name: "Create new campaign" }), 1200);

    await s.caption("Enter a campaign name", 400);
    await s.type(p.getByRole("textbox", { name: "Campaign name" }), "October payment reminders");

    await s.caption("Keep Assistant and select your agent", 500);
    await s.click(ac("Select assistant"), 700);
    await p.keyboard.type("Payment", { delay: 70 });
    await s.pause(500);
    await s.click(p.getByRole("option", { name: "Payment reminder" }), 800);

    await s.caption("Upload your calling list (CSV)", 400);
    await s.hover(p.getByRole("button", { name: "Select CSV file from device" }), 600);
    await p.getByLabel("CSV file input").setInputFiles(CSV_PATH);
    await s.pause(1400);

    await s.caption("Map each variable to a CSV column", 400);
    const mapping = sel("Map variable amount_due to a CSV column");
    await s.click(mapping, 700);
    await s.click(p.getByRole("option", { name: "due_amount" }), 900);
    await p.locator("section:has(> h1)").evaluate((e) => { e.scrollTop = 0; for (let n: HTMLElement | null = e; n; n = n.parentElement) n.scrollTop = 0; });
    await s.pause(300);
    await s.shot("upload-details", p.locator("section:has(> h1) > div").nth(1));

    await s.caption("Click Next to upload and verify the list", 400);
    await s.click(p.getByRole("button", { name: "Upload CSV and continue" }), 500);
    await p.getByText("Configure campaign").first().waitFor();
    await ac("Select phone numbers").waitFor({ timeout: 20_000 });
    await s.caption("Verified: step 2 opens", 1100);

    await s.caption("Pick numbers, or switch to Number pool", 400);
    await s.hover(ac("Select phone numbers"), 500);
    await s.click(p.getByRole("tab", { name: "Use a number pool" }), 700);
    await s.click(sel("Select number pool"), 700);
    await s.click(p.getByRole("option", { name: /Collections – Mumbai/ }), 900);

    await s.caption("Set the timezone, start and end date & time", 400);
    await s.hover(sel("Select timezone"), 300);
    await s.hover(p.getByRole("button", { name: "Campaign start date and time" }), 300);
    await s.hover(p.getByRole("button", { name: "Campaign end date and time" }), 300);

    await s.caption("Edit the calling windows, e.g. Mon–Sat only", 500);
    await s.click(p.getByRole("button", { name: "Edit calling windows" }), 800);
    await s.click(p.locator('[aria-label="Pick hours per weekday"]'), 800);
    await s.click(p.getByRole("button", { name: /^Remove Sunday/ }), 800);
    await s.shot("calling-windows", p.getByRole("dialog"));
    await s.click(p.getByRole("button", { name: "Save calling windows" }), 900);

    await s.caption("Set the retry count and cooldown period", 400);
    await s.click(sel("Retry count"), 600);
    await s.click(p.getByRole("option", { name: "2 Retries", exact: true }), 600);
    await s.hover(sel("Cooldown period"), 400);

    await s.caption("Choose who gets email notifications", 400);
    await s.hover(ac("Email notifications - select members"), 500);
    await s.shot("configure-campaign", p.locator("section:has(> h1) > div").nth(1));

    await s.caption("Click Create campaign", 400);
    await s.click(p.getByRole("button", { name: "Submit and create campaign" }), 1800);
    await s.caption("The campaign appears on the campaigns list", 1800);
  },
} satisfies Scenario;
