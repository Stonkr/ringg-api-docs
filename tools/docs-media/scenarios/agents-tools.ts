import type { Scenario } from "../run.ts";
import { makeEditorBRoutes, PR_ID, shotNoToasts } from "../fixtures/editor-b.ts";

export default {
  name: "agents-tools",
  docsPage: "agents/tools",
  routes: makeEditorBRoutes(),
  async run(s) {
    const p = s.page;
    const vis = (l: ReturnType<typeof p.locator>) => l.locator("visible=true").first();
    await s.goto(`/assistants/${PR_ID}`);
    await s.caption("Open the agent and select Tools", 600);
    await s.click(p.getByRole("button", { name: "Navigate to Tools" }), 1200);

    await s.caption("Pre-call: click API in the side panel", 600);
    await s.click(vis(p.getByRole("option", { name: "Add pre-call API tool" })), 800);
    const dialog = p.getByRole("dialog");

    await s.caption("Name the request and enter the URL", 500);
    await s.type(dialog.getByPlaceholder("what_is_this_for"), "crm_lookup");
    await s.click(dialog.getByRole("button", { name: /POST/ }), 600);
    await s.click(vis(p.locator('[role^="menuitem"]').filter({ hasText: /^GET$/ })), 500);
    await s.type(dialog.getByPlaceholder("api_url"), "https://crm.acme-lending.example/api/customers");

    await s.caption("Add parameters: pass the phone number", 500);
    await s.click(dialog.getByText("Query", { exact: true }), 500);
    await s.click(dialog.getByRole("button", { name: "Add Row" }), 600);
    await s.click(vis(p.locator('[role^="menuitem"]').filter({ hasText: /Variable/ })), 700);
    await s.type(dialog.getByPlaceholder("Key").last(), "mobile");
    await s.click(dialog.getByPlaceholder("Search variable...").last(), 600);
    await s.click(vis(p.locator('[role="option"]').filter({ hasText: /^mobile_number$/ })), 700);

    await s.caption("Click Test API to see the response", 500);
    await s.click(dialog.getByRole("button", { name: "Test API connection" }), 1300);
    await s.caption("Keep only the fields the agent needs", 500);
    await s.click(dialog.locator("div.grid-cols-12").filter({ has: p.getByText("loan", { exact: true }) }).locator("label").first(), 800);
    await shotNoToasts(s, "api-tool-response", dialog, 0);

    await s.caption("Click Add to assistant", 500);
    await s.click(dialog.getByRole("button", { name: "Save API tool" }), 1000);

    await s.caption("On-call: the agent calls these mid-conversation", 600);
    await s.click(p.getByRole("tab", { name: "On-call" }), 600);
    await s.click(vis(p.getByRole("option", { name: /call transfer/i })), 900);
    const transfer = p.getByRole("dialog");
    await s.caption("Add a transfer destination", 500);
    await s.click(transfer.getByRole("button", { name: "Add new destination" }), 600);
    await s.type(transfer.getByLabel("Destination 1 target"), "+91 98765 40200");
    await transfer.getByPlaceholder("Describe the target").last().fill("Billing team");
    await shotNoToasts(s, "call-transfer", transfer, 0);
    await s.caption("Save the tool", 500);
    await s.click(transfer.getByRole("button", { name: /Save tool|Add to assistant/ }), 1500);
    await s.caption("The tool appears in the phase's list", 900);
    await shotNoToasts(s, "on-call-tools", p.locator("main").last());

    await s.caption("Post-call: send the outcome to your systems", 600);
    await s.click(p.getByRole("tab", { name: "Post-call" }), 900);
    await s.click(vis(p.getByRole("button", { name: "Edit update_crm API" })), 700);
    const post = p.getByRole("dialog");
    await s.caption("The body can use the summary and analysis values", 500);
    await s.click(post.getByText("Body", { exact: true }), 2000);
    await p.keyboard.press("Escape");
    await s.pause(600);
  },
} satisfies Scenario;
