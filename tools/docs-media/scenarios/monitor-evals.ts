import type { Page } from "@playwright/test";
import type { Scenario } from "../run.ts";
import { evalsRoutes } from "../fixtures/monitor-evals.ts";

// Smoothly brings the h2 titled `heading` to the top of the page's scroller.
async function scrollToHeading(p: Page, heading: string, settleMs = 1400) {
  await p.evaluate((h) => [...document.querySelectorAll("h2")].find((e) => e.textContent?.trim() === h)?.scrollIntoView({ behavior: "smooth", block: "start" }), heading);
  await p.waitForTimeout(settleMs);
}

export default {
  name: "monitor-evals",
  docsPage: "monitor/evals",
  routes: { ...evalsRoutes },
  async run(s) {
    const p = s.page;
    await s.goto("/evals");
    await s.caption("Pick an agent to see its evals", 500);
    await s.click(p.locator('[data-slot="autocomplete-trigger"]').first(), 800);
    await s.click(p.getByRole("option", { name: /Payment reminder/ }).first(), 1600);

    await s.caption("Overall pass rate for the last 30 days", 2000);
    await s.caption("Click a metric to plot its line", 500);
    await s.click(p.getByRole("checkbox", { name: "Show Instruction following on the chart" }), 900);
    await s.click(p.getByRole("checkbox", { name: "Show Factual accuracy on the chart" }), 600);
    await p.mouse.move(1100, 120, { steps: 12 });
    await s.pause(1400);
    await s.shot("quality-chart", p.locator("ul[aria-label='Metrics to plot on the chart']").locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]"), 4);

    await s.caption("Review issues with the call snippet", 400);
    await scrollToHeading(p, "Issues", 2600);
    await s.shot("issues", p.locator("h2", { hasText: "Issues" }).locator("xpath=../.."), 4);

    await s.caption("Run every test case", 400);
    await scrollToHeading(p, "Test cases", 1400);
    await s.click(p.getByRole("button", { name: "Run all test cases against this agent" }), 2000);
    await s.caption("Open a case to read the verdict", 500);
    await s.click(p.getByRole("button", { name: /Customer asks to waive the late fee/ }), 2200);
    await s.shot("test-case-result", p.getByRole("dialog"), 4);
    await s.pause(900);
    await p.keyboard.press("Escape");
    await s.pause(500);

    await s.caption("Click Create a new testcase", 400);
    await s.click(p.getByRole("button", { name: "Create a custom test case" }), 900);
    const form = p.locator("[role=dialog]", { hasText: "Create a test case" });
    await s.caption("Name it, describe the path and success criteria", 400);
    await s.type(form.locator('input[aria-label="Test case name"]'), "Asks to reschedule the EMI date");
    await form.locator('textarea[aria-label="Conversation path"]').fill("The customer lost their job last month and asks to move the EMI date to the 20th.");
    await s.pause(300);
    await form.locator('textarea[aria-label="Success criteria"]').fill("The agent explains the reschedule policy and offers to raise a request.");
    await s.pause(900);
    await s.caption("Click Add test case", 400);
    await s.click(form.getByRole("button", { name: "Add test case" }), 1600);

    await s.caption("Configure: set how strictly each metric flags calls", 400);
    await s.click(p.getByRole("button", { name: "Scroll to eval settings" }), 1300);
    await s.click(p.getByRole("button", { name: "Show details for Instruction following" }), 800);
    await s.click(p.getByRole("radio", { name: "Set tolerance to Strict" }).or(p.getByRole("button", { name: "Set tolerance to Strict" })).first(), 1600);
  },
} satisfies Scenario;
