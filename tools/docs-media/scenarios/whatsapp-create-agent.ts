import type { Scenario } from "../run.ts";
import { shotNoToasts } from "../fixtures/editor-b.ts";
import { makeWhatsappEditorRoutes } from "../fixtures/whatsapp-agents.ts";

export default {
  name: "whatsapp-create-agent",
  docsPage: "whatsapp/create-agent",
  routes: makeWhatsappEditorRoutes(),
  async run(s) {
    const p = s.page;
    const dialog = p.getByRole("dialog");
    const field = (label: string) => p.locator("div.flex.flex-col.gap-1\\.5").filter({ hasText: label }).locator("[contenteditable=true]");
    const vis = (l: ReturnType<typeof p.locator>) => l.locator("visible=true").first();

    await s.goto("/assistants");
    await s.caption("Click Create agent", 500);
    await s.click(p.getByRole("button", { name: "Create agent" }), 1300);
    await s.caption("Choose the WhatsApp tab", 400);
    await s.click(dialog.getByRole("tab", { name: "WhatsApp" }), 1200);
    await shotNoToasts(s, "create-dialog", dialog, 0);
    await s.caption("Pick the single-prompt WhatsApp template", 400);
    await s.click(dialog.getByRole("button", { name: "Select WhatsApp assistant" }), 1800);

    await s.caption("Name the agent and pick a voice", 400);
    await s.type(p.getByLabel("Agent Name"), "EMI assistant");
    await s.click(p.getByRole("button", { name: "Select Ananya voice" }), 900);
    await s.caption("Click Next", 300);
    await s.click(p.getByRole("button", { name: "Next" }), 1200);

    await s.caption("Describe the business and the goal of the chat", 400);
    await s.type(field("Company details"), "Acme Lending offers personal loans across Maharashtra.");
    await s.type(field("Purpose of the call"), "Remind customers of their EMI and help them pay on WhatsApp.");
    await s.caption("Add the custom variables the agent needs", 300);
    const varInput = p.getByPlaceholder("Enter new variable");
    for (const v of ["emi_amount", "due_date"]) {
      await s.type(varInput, v);
      await p.keyboard.press("Enter");
    }
    await s.caption("Select the registered WhatsApp number", 400);
    const numberSelect = p.getByRole("button", { name: /WhatsApp Number/ });
    await numberSelect.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "smooth" }));
    await s.pause(700);
    await s.click(numberSelect, 700);
    await s.click(p.getByRole("option", { name: "+919876540322" }), 900);
    await shotNoToasts(s, "select-number", numberSelect.locator("xpath=ancestor::div[contains(@class,'@2xl:flex-row')][1]"), 12);

    await s.caption("Click Create Assistant", 400);
    await s.click(p.getByRole("button", { name: "Create Assistant" }), 2000);
    await s.caption("The agent opens in the editor", 1500);
    await p.waitForURL(/\/assistants\/[0-9a-f-]{36}/, { timeout: 20000 });
    await s.pause(1200);
    // Chrome's spellcheck would underline tool tags like end_chat in the prompt.
    await p.evaluate(() => document.querySelectorAll("[contenteditable]").forEach((e) => e.setAttribute("spellcheck", "false")));

    await s.caption("WhatsApp Templates: pick what the agent may send", 400);
    await s.click(p.getByRole("button", { name: "WhatsApp Templates" }), 900);
    await s.click(p.getByRole("button", { name: "Select WhatsApp templates" }), 900);
    await s.click(p.getByRole("button", { name: "Toggle payment_receipt template" }), 1200);
    const setup = p.getByRole("dialog");
    await s.caption("Fill each variable: Variable, Static or Dynamic", 400);
    await s.click(setup.getByRole("combobox", { name: "{{customer_name}}" }), 500);
    await s.click(vis(p.getByRole("option", { name: "customer_name" })), 300);
    await s.click(setup.getByRole("combobox", { name: "{{amount}}" }), 500);
    await s.click(vis(p.getByRole("option", { name: "emi_amount" })), 300);
    await s.click(setup.getByRole("button", { name: "Parameter source type" }).last(), 500);
    await s.click(vis(p.getByRole("option", { name: "Dynamic" })), 600);
    await s.type(setup.getByRole("textbox", { name: "{{loan_account}}" }), "Loan account the customer mentions");
    await shotNoToasts(s, "template-variables", setup, 0);
    await s.caption("Click Save template", 300);
    await s.click(setup.getByRole("button", { name: "Save template" }), 1600);
    await s.caption("Tag it in the prompt as @||send_payment_receipt||", 1300);

    await s.caption("Attach Number shows the number this agent answers on", 400);
    await s.click(p.getByRole("button", { name: "Attach Number" }), 1300);

    await s.caption("Chat → Settings: the WhatsApp session timeouts", 400);
    await s.click(p.getByRole("button", { name: "Navigate to Settings" }).last(), 1200);
    const session = p.getByText("WhatsApp session", { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded')][1]");
    await s.caption("End idle chats sooner to get results earlier", 400);
    await s.click(p.getByRole("combobox", { name: "End the chat after no messages for" }), 600);
    await s.click(vis(p.getByRole("option", { name: "1 hour" })), 1200);
    await shotNoToasts(s, "whatsapp-session", session, 8);

    await s.caption("Test assistant: scan the QR code from your phone", 400);
    await s.click(p.getByRole("button", { name: "Test assistant" }), 1800);
    await p.keyboard.press("Escape");
    await s.pause(500);
  },
} satisfies Scenario;
