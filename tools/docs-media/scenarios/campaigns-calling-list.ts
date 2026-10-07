import type { Scenario } from "../run.ts";
import { campaignRoutes, CSV_PATH } from "../fixtures/campaigns.ts";

export default {
  name: "campaigns-calling-list",
  title: "Calling list",
  docsPage: "campaigns/calling-list",
  routes: { ...campaignRoutes },
  async run(s) {
    const p = s.page;
    const ac = (label: string) => p.locator(`[data-slot=autocomplete-trigger]:has(button[aria-label="${label}"])`);
    const sel = (label: string) => p.locator(`[data-slot=select-trigger][aria-label="${label}"]`);
    const card = (title: string) => p.getByText(title, { exact: true }).first().locator("xpath=ancestor::*[2]");
    await p.context().addCookies([{ name: "sidebar:state", value: "false", url: "http://localhost:3201" }]);
    await s.goto("/campaigns/create");

    // Name and agent come first; the agent's variables decide the columns to map.
    await p.getByRole("textbox", { name: "Campaign name" }).fill("October payment reminders");
    await s.caption("Pick the agent whose variables the list fills", 400);
    await s.click(ac("Select assistant"), 500);
    await p.keyboard.type("Payment", { delay: 60 });
    await s.click(p.getByRole("option", { name: "Payment reminder" }), 600);

    await s.caption("Upload your CSV under Upload calling list", 400);
    await s.hover(p.getByRole("button", { name: "Select CSV file from device" }), 500);
    await p.getByLabel("CSV file input").setInputFiles(CSV_PATH);
    await s.pause(1200);
    await s.caption("The preview shows your file, 15 rows per page", 1200);

    await s.caption("Matching headers are mapped automatically", 1400);
    await s.caption("Map the rest by hand: amount_due → due_amount", 400);
    await s.click(sel("Map variable amount_due to a CSV column"), 600);
    await s.click(p.getByRole("option", { name: "due_amount" }), 800);
    await s.shot("calling-list-settings", card("Calling list settings"));
    await s.caption("One country code for the whole list (+91 default)", 400);
    await s.hover(p.locator('[aria-label="Country code"]').first(), 1000);
    await s.caption("Remove invalid rows is on by default", 400);
    await s.hover(p.getByLabel("Remove invalid rows from CSV").locator("xpath=ancestor::label[1]"), 1000);
    await s.caption("Transliterate names into the agent's language", 400);
    await s.click(p.getByLabel("Transliterate callee_name").locator("xpath=ancestor::label[1]"), 1200);

    await s.caption("Click Next: Ringg verifies every row", 400);
    await s.click(p.getByRole("button", { name: "Upload CSV and continue" }), 500);
    await p.getByText("Valid contacts").waitFor({ timeout: 20_000 });
    await s.pause(600);
    await s.caption("Invalid rows are counted and can be downloaded", 400);
    await s.hover(p.getByRole("button", { name: "Download invalid entries CSV" }), 1600);
    await s.shot("upload-summary", p.getByText("Total rows").locator("xpath=ancestor::*[3]"));
  },
} satisfies Scenario;
