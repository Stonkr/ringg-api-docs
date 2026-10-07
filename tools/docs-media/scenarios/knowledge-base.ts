import { resolve } from "node:path";
import type { Scenario } from "../run.ts";
import { kbRoutes } from "../fixtures/kb.ts";

const CSV = resolve(import.meta.dirname, "../fixtures/acme-lending-faq.csv");

export default {
  name: "knowledge-base",
  docsPage: "knowledge-base/overview",
  routes: kbRoutes,
  async run(s) {
    const p = s.page;
    p.setDefaultTimeout(20000);
    await s.goto("/knowledge-base");
    await s.caption("Open Knowledge base and click Create", 600);
    await s.click(p.getByRole("button", { name: "Create knowledge base" }).first(), 1200);

    await s.caption("Name it", 300);
    await s.type(p.getByRole("textbox", { name: "Knowledge base name" }), "Loan FAQs");
    await s.caption("Upload a file: a CSV opens in a preview", 300);
    await s.hover(p.getByLabel("Drag and drop or click to upload"), 600);
    await p.getByLabel("File upload input").setInputFiles(CSV);
    await s.pause(1800);
    await s.caption("Check the CSV's columns and types", 300);
    await s.hover(p.getByText("Column Configuration"), 1200);
    await s.shot("csv-preview", p.locator("main").locator("div.min-h-0.min-w-0.flex-1").first());

    await s.caption("On Add URLs, crawl your site and click Fetch Links", 300);
    await s.click(p.getByRole("tab", { name: "Add URLs" }), 500);
    await s.type(p.getByRole("textbox", { name: "Website to crawl" }), "https://www.acme-lending.example");
    await s.click(p.getByRole("button", { name: "Fetch links" }), 1300);
    await s.caption("Tick only the pages you want", 300);
    // HeroUI v2 checkbox: the transparent input covers the box (its accessible name comes from aria-labelledby).
    const tick = (label: string) => s.click(p.locator(`input[type="checkbox"][aria-label="${label}"]`), 450);
    await tick("Select all URLs");
    await tick("Select https://www.acme-lending.example/personal-loans/faq");
    await s.caption("Click a URL to preview the text Ringg extracts", 300);
    await s.click(p.getByRole("button", { name: "Preview https://www.acme-lending.example/personal-loans/faq" }), 1800);

    await s.caption("Click Save", 300);
    await s.click(p.getByRole("button", { name: "Save knowledge base" }), 1500);
    await s.caption("Files show Processing while it trains", 2500);
    await s.pause(5000);
    await s.caption("Indexed: the knowledge base is Ready", 1500);
    await s.click(p.getByRole("button", { name: "Back to test" }), 1500);
    await s.caption("Ask the test chat a question", 300);
    await s.type(p.getByRole("textbox", { name: "Ask a question about your data" }), "What credit score do I need for a personal loan?");
    await p.keyboard.press("Enter");
    await s.pause(2000);
    await s.caption("Each answer lists the files it came from", 2000);
    await s.shot("test-chat", p.locator("main"));
    await s.caption("Click the CSV to open its rows", 300);
    await s.click(p.getByText("acme-lending-faq.csv").first(), 1300);
    await s.caption("Search, add or edit rows without re-uploading", 300);
    await s.type(p.getByRole("textbox", { name: "Search rows" }), "EMI");
    await s.pause(1500);
    await s.click(p.getByRole("button", { name: "Back to knowledge bases" }).first(), 1200);
    await s.caption("The list shows it Ready, with its sources", 1600);
    await s.shot("kb-list", p.locator("main"));
  },
} satisfies Scenario;
