import type { Scenario } from "../run.ts";
import { agentsCreateRoutes } from "../fixtures/agents-create.ts";

export default {
  name: "agents-create",
  docsPage: "agents/create",
  routes: agentsCreateRoutes,
  async run(s) {
    const p = s.page;
    const dialog = p.getByRole("dialog");
    const field = (label: string) => p.locator("div.flex.flex-col.gap-1\\.5").filter({ hasText: label }).locator("[contenteditable=true]");

    await s.goto("/assistants");
    await s.caption("Click Create agent", 600);
    await s.click(p.getByRole("button", { name: "Create agent" }), 1400);

    await s.caption("Pick a channel", 400);
    await s.click(dialog.getByRole("tab", { name: "Inbound" }), 900);
    await s.click(dialog.getByRole("tab", { name: "Outbound" }), 600);
    await s.shot("create-dialog", dialog, 0);

    await s.caption("Filter by industry, or start blank", 400);
    await s.click(dialog.getByRole("button", { name: "Select Financial industry" }), 1200);
    await s.click(dialog.getByRole("button", { name: "Select blank template" }), 900);
    await s.caption("Multi Prompt builds a flow on a canvas", 400);
    await s.hover(dialog.getByRole("button", { name: "Select Multi Prompt" }), 1400);

    await s.caption("Click the general single-prompt template", 400);
    await s.click(dialog.getByRole("button", { name: "Select Outbound assistant" }), 1800);

    await s.caption("Name the agent and pick its languages", 400);
    await s.type(p.getByLabel("Agent Name"), "EMI reminder");
    await s.click(p.getByRole("button", { name: /Secondary Language/ }), 700);
    await s.click(p.getByRole("option", { name: "Hindi" }), 1000);
    await s.caption("Select a voice", 400);
    await s.click(p.getByRole("button", { name: "Select Ananya voice" }), 1200);
    await s.shot("agent-basics", p.locator("form"), 0);
    await s.caption("Click Next", 300);
    await s.click(p.getByRole("button", { name: "Next" }), 1200);

    await s.caption("Fill in the call context", 400);
    await s.type(field("Company details"), "Acme Lending offers personal and two-wheeler loans across Maharashtra.");
    await s.type(field("Purpose of the call"), "Remind the customer of their upcoming EMI and note the date they will pay.");
    await p.evaluate(() => window.scrollTo(0, 0));
    await s.shot("call-context", p.locator("form"), 0);

    await s.caption("Add variables and a knowledge base", 300);
    const varInput = p.getByPlaceholder("Enter new variable");
    await s.type(varInput, "emi_amount");
    await p.keyboard.press("Enter");
    await s.type(varInput, "due_date");
    await p.keyboard.press("Enter");
    // HeroUI's select closes on scroll, so centre it first; the option takes a virtual click (a real one did not register headless).
    const kb = p.getByRole("button", { name: /Knowledge Base/ });
    await kb.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "smooth" }));
    await p.waitForTimeout(700);
    const kbBox = await kb.boundingBox();
    if (kbBox) {
      await p.mouse.move(kbBox.x + kbBox.width / 2, kbBox.y + kbBox.height / 2, { steps: 20 });
      await p.mouse.click(kbBox.x + kbBox.width / 2, kbBox.y + kbBox.height / 2);
    }
    await p.waitForTimeout(700);
    const option = p.getByRole("option", { name: "EMI and late fee policy" });
    const opt = await option.boundingBox();
    if (opt) await p.mouse.move(opt.x + opt.width / 2, opt.y + opt.height / 2, { steps: 20 });
    await p.waitForTimeout(300);
    await option.dispatchEvent("click");
    await p.waitForTimeout(600);
    if (kbBox) await p.mouse.click(kbBox.x + kbBox.width / 2, kbBox.y + kbBox.height / 2);
    await p.waitForTimeout(700);

    await s.caption("Click Create Assistant", 400);
    await s.click(p.getByRole("button", { name: "Create Assistant" }), 2500);
    await s.caption("The agent opens in the editor", 2500);
  },
} satisfies Scenario;
