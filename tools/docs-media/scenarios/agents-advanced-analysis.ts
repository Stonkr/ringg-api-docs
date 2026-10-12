import type { Scenario } from "../run.ts";
import { makeEditorBRoutes, PR_ID, shotNoToasts } from "../fixtures/editor-b.ts";

export default {
  name: "agents-advanced-analysis",
  docsPage: "agents/advanced-analysis",
  routes: makeEditorBRoutes(),
  async run(s) {
    const p = s.page;
    await s.goto(`/assistants/${PR_ID}`);
    await s.caption("Open Advanced Analysis", 800);
    await s.click(p.getByRole("button", { name: "Navigate to Advanced Analysis" }), 1400);

    await s.caption("Click Add a new variable", 600);
    await s.click(p.getByRole("button", { name: "Add a new variable" }), 1000);
    const dialog = p.getByRole("dialog");

    await s.caption("Name it, pick a type and describe it", 500);
    await s.type(dialog.getByLabel("Variable name"), "payment promised");
    await s.type(dialog.locator("textarea").first(), "True if the customer agreed to pay by a specific date.");
    await s.type(dialog.getByRole("textbox").nth(2), "false");

    await s.caption("Turn on Use as goal (Boolean only)", 500);
    await s.click(dialog.locator('label:has(input[aria-label="Use as goal"])'), 900);
    await shotNoToasts(s, "add-variable", dialog, 0);

    await s.caption("Add several at once: a Number this time", 500);
    await s.click(dialog.getByRole("button", { name: "Add new variable" }), 700);
    await s.type(dialog.getByLabel("Variable name").last(), "amount promised");
    await s.click(dialog.getByRole("button", { name: "Type" }).last(), 600);
    await s.click(p.getByRole("option", { name: "Number", exact: true }), 600);
    await s.type(dialog.locator("textarea").last(), "Amount in rupees the customer promised to pay.");

    await s.caption("Click Add", 500);
    await s.click(dialog.getByRole("button", { name: "Add variable" }), 1500);
    await shotNoToasts(s, "variables", p.locator('[aria-label="Advanced Analysis variables"]'));

    await s.caption("Give context and include tool call logs", 500);
    await s.click(p.locator('label:has(input[aria-label="Log tool calls to enhance advanced analysis"])'), 700);
    await s.click(p.getByRole("button", { name: /Context/ }).first(), 1300);

    await s.caption("Click Test to try it on a past call", 600);
    await s.click(p.getByRole("button", { name: "Test Advanced Analysis" }), 1200);
    const test = p.getByRole("dialog");
    await s.caption("Pick a call from the recent call log", 600);
    await s.click(test.getByRole("row").filter({ hasText: "Rahul Verma" }), 2000);
    await s.caption("Check the result against the transcript", 1500);
    await shotNoToasts(s, "test-result", test, 0);
    await s.pause(1200);
  },
} satisfies Scenario;
