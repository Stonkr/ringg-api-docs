import type { Scenario } from "../run.ts";
import { AGENT_ID, editorARoutes } from "../fixtures/editor-a.ts";

export default {
  name: "agents-variables",
  docsPage: "agents/variables",
  routes: editorARoutes(),
  async run(s) {
    const p = s.page;
    await s.goto(`/assistants/${AGENT_ID}`);

    await s.caption("Open Custom Variables in the editor sidebar", 800);
    await s.click(p.getByText("Custom Variables", { exact: true }).first(), 1300);

    await s.caption("Type a name: it becomes lowercase snake_case");
    await s.type(p.getByPlaceholder("Enter variable name"), "Loan Account");
    await s.pause(700);
    await s.caption("Click Add; the list saves at once");
    await s.click(p.getByRole("button", { name: /^Add/ }).first(), 1500);
    const panel = p.getByPlaceholder("Enter variable name").locator("xpath=ancestor::div[.//*[normalize-space()='loan_account']][1]");
    await s.shot("variables-panel", panel, 12);
    await s.caption("Sort the list alphabetically", 400);
    await s.click(p.getByRole("button", { name: "Sort variables alphabetically" }), 1100);
    await s.click(p.getByRole("button", { name: "Sort variables alphabetically" }), 500);

    await s.caption("Use it in the prompt: type @ and pick it");
    const goal = p.locator('[contenteditable="true"]').nth(2).locator("p").last();
    await s.hover(goal, 300);
    const b = (await goal.boundingBox())!;
    await goal.click({ position: { x: b.width - 3, y: b.height / 2 } });
    await p.keyboard.press("End");
    await p.keyboard.type(" Quote the loan account number ", { delay: 45 });
    await p.keyboard.type("@loan", { delay: 110 });
    await s.pause(1300);
    await s.shot("variable-in-menu", p.getByRole("button", { name: /Loan Account/ }).locator("xpath=ancestor::div[contains(@class,'overflow-y-auto')][1]"), 40);
    await p.keyboard.press("Enter");
    await p.keyboard.type(" if they ask.", { delay: 45 });
    await s.pause(800);

    await s.caption("Click Save");
    await s.click(p.getByRole("button", { name: "Save prompt changes" }), 1800);
    await s.caption("Each call fills the chip with that call's value", 1300);
    await s.hover(goal, 600);

    await s.caption("Test assistant shows a field per variable", 400);
    await s.click(p.getByRole("button", { name: /Test assistant/ }), 1200);
    const d = p.getByRole("dialog");
    await s.type(d.getByLabel("Loan account"), "AL-20931");
    await s.caption("Campaign CSVs and the API fill them for real calls", 1800);
  },
} satisfies Scenario;
