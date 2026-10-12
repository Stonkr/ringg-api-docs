import type { Scenario } from "../run.ts";
import { multiPromptRoutes } from "../fixtures/multi-prompt.ts";

export default {
  name: "agents-multi-prompt",
  docsPage: "agents/multi-prompt",
  routes: multiPromptRoutes,
  async run(s) {
    const p = s.page;
    const panel = p.locator("div.absolute.inset-y-0.right-0.z-50");
    const node = (label: string) => p.locator(".react-flow__node").filter({ hasText: label }).first();
    // Fit to screen ignores the settings panel, so zoom out once and nudge the flow left of it.
    const frame = async () => {
      await p.getByRole("button", { name: "Fit to screen" }).click();
      await p.waitForTimeout(500);
      await p.getByRole("button", { name: "Zoom out" }).click();
      await p.waitForTimeout(300);
      await p.mouse.move(500, 450);
      for (let i = 0; i < 6; i++) {
        await p.mouse.wheel(40, 0);
        await p.waitForTimeout(40);
      }
      // Park the cursor on empty canvas so no node shows its hover actions.
      await p.mouse.move(150, 130, { steps: 10 });
      await p.waitForTimeout(300);
    };
    // Collapsed sidebar, so panned canvas nodes are never underneath it.
    await p.context().addCookies([{ name: "sidebar:state", value: "false", url: "http://localhost:3201" }]);
    await s.goto("/assistants");
    await s.caption("Open a multi-prompt agent from Assistants", 1000);
    await s.click(p.getByText("Loan application flow").first(), 2200);

    await s.caption("Fit the flow to the screen", 400);
    await s.click(p.getByRole("button", { name: "Fit to screen" }), 300);
    await frame();
    await s.caption("Each node does one job; edges connect them", 2000);
    await s.shot("canvas");

    await s.caption("Click a node's output dot to add a node", 400);
    await s.click(p.getByLabel("Add node for branch 2"), 900);
    await s.shot("node-picker", p.locator("div.fixed.z-\\[9999\\]").first(), 12);
    await s.caption("Blocked node types are greyed out", 300);
    await s.hover(p.getByText("Router", { exact: true }), 1400);
    await p.keyboard.press("Escape");
    await p.mouse.click(300, 820);
    await p.waitForTimeout(400);
    await frame();

    await s.caption("Agent node: a conversation with its own prompt", 400);
    await s.click(node("Greet and confirm identity"), 1000);
    await s.click(panel.getByText("Prompt", { exact: true }), 1400);
    await s.shot("agent-node-settings", panel, 0);

    await s.caption("LLM Router: branch on what the caller says", 400);
    await s.click(node("Interested?"), 1600);
    await s.caption("It can also extract values from the reply", 300);
    await s.hover(panel.getByText("Extract variables", { exact: false }).first(), 1300);

    await s.caption("Collect: capture a PIN by voice or keypad", 400);
    await s.click(node("Collect PIN code"), 2000);

    await s.caption("Action: call your API in the middle of the call", 400);
    await s.click(node("Check eligibility"), 1400);
    const dialog = p.getByRole("dialog");
    await s.click(dialog.getByText("Body", { exact: true }), 1200);
    await s.caption("Test the request and pick the response keys to store", 400);
    await s.click(dialog.getByRole("button", { name: "Test API connection" }), 1600);
    await s.shot("action-request", dialog, 0);
    await s.click(dialog.getByRole("button", { name: /close/i }).first(), 700);

    await s.caption("Logic Router: branch on data, no question asked", 400);
    await s.click(node("Eligible?"), 1700);

    await s.caption("Speak: a fixed line, with variations per language", 400);
    await s.click(node("Confirm offer"), 1000);
    await s.click(panel.getByRole("button", { name: /next/i }).first(), 1200);

    await s.caption("Keypad Menu: press a key to choose a branch", 400);
    await s.click(node("Advisor callback?"), 2000);

    await s.caption("Click empty canvas for Global Settings", 400);
    await p.mouse.move(150, 420, { steps: 28 });
    await p.mouse.click(150, 420);
    await p.waitForTimeout(1200);
    await s.click(panel.getByText("Call", { exact: true }), 2000);
  },
} satisfies Scenario;
