import type { Scenario } from "../run.ts";
import { shotNoToasts } from "../fixtures/editor-b.ts";
import { PR_ID, makeWhatsappEditorRoutes } from "../fixtures/whatsapp-agents.ts";

// One video for both WhatsApp tool pages: the on-call tools (on-call-tools.mdx) and the post-call tool (post-call-tools.mdx), on a voice agent.
export default {
  name: "whatsapp-tools",
  docsPage: "whatsapp/on-call-tools",
  routes: makeWhatsappEditorRoutes(),
  async run(s) {
    const p = s.page;
    const vis = (l: ReturnType<typeof p.locator>) => l.locator("visible=true").first();
    const pickVariable = (dialog: ReturnType<typeof p.locator>, label: string, variable: string) => s.click(dialog.getByRole("combobox", { name: label }), 400).then(() => s.click(vis(p.getByRole("option", { name: variable, exact: true })), 400));

    await s.goto(`/assistants/${PR_ID}`);
    await s.caption("Open the voice agent and select Tools", 500);
    await s.click(p.getByRole("button", { name: "Navigate to Tools" }), 1100);
    await s.caption("Open the On-call tab", 400);
    await s.click(p.getByRole("tab", { name: "On-call" }), 800);
    await s.caption("Expand Integration and pick WhatsApp Business", 400);
    await s.click(vis(p.getByRole("option", { name: "Expand on-call integrations" })), 900);
    await s.click(vis(p.getByRole("option", { name: "Add WhatsApp Business tool" })), 1400);

    const dialog = p.getByRole("dialog");
    await s.caption("Two tools: Send WhatsApp Template and Send WhatsApp Text", 400);
    await s.click(dialog.getByRole("button", { name: "Toggle Send WhatsApp Text" }), 1500);
    await s.caption("Text is free-form, inside the 24-hour window only", 1200);
    await s.click(dialog.getByRole("button", { name: "Toggle Send WhatsApp Template" }), 900);

    await s.caption("Choose the sender; leave Send to blank for the customer", 400);
    await s.click(dialog.getByRole("button", { name: "Sender number" }), 500);
    await s.click(vis(p.getByRole("option", { name: /98765 40321/ })), 700);
    await s.caption("Pick the template", 400);
    await s.click(dialog.getByRole("button", { name: /Pick a template/ }), 500);
    await s.click(vis(p.getByRole("option", { name: /emi_due_reminder/ })), 900);
    await s.caption("Map each body variable to a custom variable", 400);
    await pickVariable(dialog, "{{1}}", "customer_name");
    await pickVariable(dialog, "{{2}}", "emi_amount");
    await pickVariable(dialog, "{{3}}", "loan_id");
    await pickVariable(dialog, "{{4}}", "due_date");
    await s.caption("Add test value gives a variable a sample for Run test", 400);
    await s.click(dialog.getByRole("button", { name: "Add test value for {{1}}" }), 500);
    await s.type(dialog.getByRole("textbox", { name: "Test value for {{1}}" }), "Rahul");
    await s.caption("Click Run test, then Import", 400);
    await s.click(dialog.getByRole("button", { name: "Run test for Send WhatsApp Template" }), 1200);
    // Scroll back so the shot starts at Send from (the config is taller than the dialog).
    await dialog.getByText("Send from", { exact: true }).first().evaluate((e) => e.scrollIntoView({ block: "start", behavior: "smooth" }));
    await s.pause(900);
    await shotNoToasts(s, "template-tool", dialog, 0);
    await s.click(dialog.getByRole("button", { name: "Import Send WhatsApp Template" }), 1600);
    await s.caption("The tool appears in the On-call list", 1200);
    await shotNoToasts(s, "on-call-list", p.locator("main").last());

    await s.caption("Post-call: the template is sent after every conversation", 400);
    await s.click(p.getByRole("tab", { name: "Post-call" }), 900);
    await s.click(vis(p.getByRole("option", { name: "Expand post-call integrations" })), 900);
    await s.click(vis(p.getByRole("option", { name: "Add WhatsApp Business tool" })), 1400);
    const post = p.getByRole("dialog");
    await s.caption("Only Send WhatsApp Template is offered post-call", 1000);
    await s.click(post.getByRole("button", { name: "Sender number" }), 500);
    await s.click(vis(p.getByRole("option", { name: /98765 40321/ })), 600);
    await s.click(post.getByRole("button", { name: /Pick a template/ }), 500);
    await s.click(vis(p.getByRole("option", { name: /payment_receipt/ })), 900);
    await s.caption("Named variables get rows with their names", 400);
    await pickVariable(post, "{{customer_name}}", "customer_name");
    await pickVariable(post, "{{amount}}", "emi_amount");
    await pickVariable(post, "{{loan_account}}", "loan_id");
    await post.getByText("Send from", { exact: true }).first().evaluate((e) => e.scrollIntoView({ block: "start", behavior: "smooth" }));
    await s.pause(900);
    await shotNoToasts(s, "post-call-tool", post, 0);
    await s.caption("Click Import", 400);
    await s.click(post.getByRole("button", { name: "Import Send WhatsApp Template" }), 1600);
    await s.caption("Each send shows as a tool call in Logs", 1800);
  },
} satisfies Scenario;
