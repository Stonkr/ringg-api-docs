import type { Locator } from "@playwright/test";
import type { Scenario } from "../run.ts";
import { buildWorkflowRoutes } from "../fixtures/workflows-build.ts";

export default {
  name: "workflows-build",
  docsPage: "workflows/build",
  routes: buildWorkflowRoutes(),
  async run(s) {
    const p = s.page;
    p.setDefaultTimeout(20000);
    // Brisker than s.click: shorter cursor travel and settle.
    const fclick = async (target: Locator, after = 300) => {
      await target.scrollIntoViewIfNeeded();
      const b = await target.boundingBox();
      if (b) await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 14 });
      await p.waitForTimeout(120);
      await target.click();
      await p.waitForTimeout(after);
    };
    const qtype = async (target: Locator, text: string, delay = 30) => {
      await fclick(target, 120);
      await p.keyboard.type(text, { delay });
      await s.pause(250);
    };
    const pick = async (trigger: Locator, option: string | RegExp, after = 350) => {
      await fclick(trigger, 400);
      await fclick(p.getByRole("option", { name: option }).first(), after);
    };
    const fit = async () => { await p.getByRole("button", { name: "Fit to screen" }).first().click(); await s.pause(500); };
    const nodeById = (id: string) => p.locator(`.react-flow__node[data-id="${id}"]`);
    // Adds a block from a connector on `from` and returns the new node.
    const add = async (from: Locator, handle: string, block: RegExp) => {
      await fclick(from.getByLabel(handle), 400);
      await fclick(p.getByRole("option", { name: block }), 650);
      return nodeById((await p.locator(".react-flow__node").last().getAttribute("data-id"))!);
    };
    const rename = async (node: Locator, family: string, name: string) => {
      await fclick(node.getByRole("button", { name: `Rename this ${family} node` }), 150);
      await p.keyboard.press("ControlOrMeta+a");
      await p.keyboard.type(name, { delay: 25 });
      await p.keyboard.press("Enter");
      await s.pause(250);
    };
    const clickPane = async () => { await p.mouse.click(700, 130); await s.pause(250); };
    const NEXT = "Add the next node, or drag to connect";

    await s.goto("/workflows");
    await s.caption("Go to Workflows and click Create workflow", 500);
    await fclick(p.getByRole("link", { name: "Create a workflow" }), 1300);

    await s.caption("Name it", 300);
    await fclick(p.getByRole("button", { name: "Edit workflow name" }), 250);
    await p.getByRole("textbox", { name: "Workflow name" }).fill("");
    await p.keyboard.type("Payment reminder follow-up", { delay: 30 });
    await p.keyboard.press("Enter");
    await s.pause(300);

    // Agent: Call
    await s.caption("Click + on Start and add an Agent block", 300);
    const start = p.locator(".react-flow__node").first();
    const call = await add(start, NEXT, /^Agent/);
    await s.caption("Pick the agent, its numbers, and fill its variables", 300);
    await pick(call.getByRole("button", { name: /Select an agent/ }), "Payment reminder", 500);
    await fclick(call.getByRole("button", { name: "Caller numbers" }).last(), 700);
    await fclick(p.getByRole("option", { name: /98765 40300/ }), 300);
    await clickPane();
    await fclick(call.getByRole("button", { name: "Map agent variables from upstream" }).last(), 600);
    const dialog = p.getByRole("dialog");
    await fclick(dialog.getByRole("combobox").nth(0), 600);
    await fclick(p.getByRole("option", { name: /Callee name/ }), 300);
    await qtype(dialog.getByRole("combobox").nth(1), "12500");
    await clickPane();

    // Conditional on the call's analysis
    await s.caption("Add a Conditional: did the borrower promise to pay?", 300);
    const cond = await add(call, NEXT, /^Conditional/);
    await fit();
    await rename(cond, "condition", "Promised to pay?");
    await fclick(cond.getByRole("button", { name: "Add a rule" }), 300);
    await pick(cond.getByRole("button", { name: /Rule source/ }), "Custom analysis");
    await pick(cond.getByRole("button", { name: /Which field|Pick a field/ }), "Payment promised");
    await qtype(cond.getByRole("textbox", { name: "Value to compare against" }), "true");

    // Match: Action
    await s.caption("On Match, add an Action that calls your CRM", 300);
    const action = await add(cond, "Add the node that runs when the rules match, or drag to connect", /^Action/);
    await rename(action, "action", "Log promise in CRM");
    await pick(action.getByRole("button", { name: /HTTP method/ }), "POST");
    await qtype(action.getByRole("textbox", { name: "Request URL" }), "https://crm.acme-lending.example/promises", 18);

    // No match: Await, then Agent: Chat
    await s.caption("On No match, add an Await block: wait 1 day", 300);
    const wait = await add(cond, "Add the node that runs when the rules do not match, or drag to connect", /^Await/);
    await fit();
    await rename(wait, "await", "Wait a day");
    await fclick(wait.getByRole("button", { name: "Wait 1d" }), 400);
    await s.caption("Then an Agent block in Chat mode: a WhatsApp nudge", 300);
    const chat = await add(wait, NEXT, /^Agent/);
    await fit();
    await fclick(chat.getByLabel("Chat", { exact: true }), 450);
    await pick(chat.getByRole("button", { name: /Select an agent/ }), "WhatsApp concierge", 400);
    await rename(chat, "agent", "WhatsApp nudge");
    await qtype(chat.getByRole("textbox", { name: "WhatsApp template name" }), "emi_due_reminder", 25);
    await qtype(chat.getByRole("textbox", { name: "WhatsApp phone number id" }), "104857600211", 25);
    await clickPane();
    await fit();
    await s.caption("Call, branch, act, wait and message in one flow", 1500);
    await s.shot("workflow-canvas");

    await s.caption("Click Save", 300);
    await fclick(p.getByRole("button", { name: "Save the workflow" }), 1100);
    await s.caption("Click Publish, then confirm", 300);
    await fclick(p.getByRole("button", { name: "Publish the workflow" }), 600);
    await s.shot("publish-dialog", p.getByRole("dialog"));
    await fclick(p.getByRole("button", { name: "Confirm publish" }), 1300);
    await s.caption("Click Test and enter who to call", 300);
    await fclick(p.getByRole("button", { name: "Start a test run" }).first(), 600);
    await qtype(p.getByRole("textbox", { name: "Value for callee_name" }), "Rahul Verma");
    await qtype(p.getByRole("textbox", { name: "Value for callee_number" }), "+91 98765 43210");
    await s.caption("Click Start run and watch each block finish", 300);
    await fclick(p.getByRole("button", { name: "Start the test run" }), 800);
    await fit();
    await s.pause(3200);
    await s.caption("Completed: the run took the Match path", 1600);
    await s.shot("test-run-completed");
  },
} satisfies Scenario;
