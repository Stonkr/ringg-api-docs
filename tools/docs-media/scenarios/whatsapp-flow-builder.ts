import type { Locator } from "@playwright/test";
import type { Scenario, Session } from "../run.ts";
import { shotNoToasts } from "../fixtures/editor-b.ts";
import { WA_ACCOUNT_ID, whatsappAccountRoutes } from "../fixtures/whatsapp.ts";
import { FLOW_IDS, makeWhatsappFlowRoutes } from "../fixtures/whatsapp-flows.ts";

/** Replaces a field's text, with the cursor moving to it first. */
export async function retype(s: Session, target: Locator, text: string) {
  await s.click(target, 150);
  await s.page.keyboard.press("ControlOrMeta+A");
  await s.page.keyboard.type(text, { delay: 55 });
  await s.pause(400);
}

// Builds "Site visit request" from scratch: two screens, the preview, View as JSON, save, publish, Duplicate & edit.
export default {
  name: "whatsapp-flow-builder",
  docsPage: "documentation/build-agents/agents/whatsapp-agents/flow-builder",
  routes: { "GET /workspace/features": {}, ...whatsappAccountRoutes, ...makeWhatsappFlowRoutes({ without: [FLOW_IDS.siteVisit] }) },
  async run(s) {
    const p = s.page;
    await s.goto(`/integrations/whatsapp/${WA_ACCOUNT_ID}`);
    await s.caption("Open your WhatsApp account, select Flows, then Create Flow", 500);
    await s.click(p.getByRole("tab", { name: "Flows" }), 900);
    await s.click(p.getByRole("button", { name: "Create a Flow" }).first(), 1000);

    const dialog = p.getByRole("dialog");
    await s.caption("Name it and pick a category", 400);
    await s.type(dialog.getByRole("textbox", { name: "Flow name" }), "Site visit request");

    await s.caption("Give the screen a title and edit its Short answer", 400);
    await retype(s, dialog.getByRole("textbox", { name: "Page title" }), "Your details");
    await s.click(dialog.getByRole("button", { name: "Edit Short answer" }), 600);
    await s.type(dialog.getByRole("textbox", { name: "Question label" }), "Full name");

    await s.caption("Click + to add a screen", 400);
    await s.click(dialog.getByRole("button", { name: "Add screen" }), 900);
    await retype(s, dialog.getByRole("textbox", { name: "Page title" }), "Visit details");
    await s.click(dialog.getByRole("button", { name: "Remove Short answer" }), 500);
    await s.caption("Add content adds text and questions, such as a dropdown", 400);
    await s.click(dialog.getByRole("button", { name: "Add content" }), 600);
    await s.click(p.getByRole("menuitem", { name: "Add Dropdown" }), 600);
    await s.type(dialog.getByRole("textbox", { name: "Question label" }), "Project");
    await s.type(dialog.getByRole("textbox", { name: "Option 1 title" }), "Green Acres Villas");
    await s.type(dialog.getByRole("textbox", { name: "Option 2 title" }), "Lakeview Residences");
    await s.click(dialog.getByRole("button", { name: "Add content" }), 600);
    await s.click(p.getByRole("menuitem", { name: "Add Date picker" }), 600);
    await s.type(dialog.getByRole("textbox", { name: "Question label" }), "Preferred visit date");
    await dialog.getByRole("textbox", { name: "Flow name" }).evaluate((e) => e.scrollIntoView({ block: "center", behavior: "smooth" }));
    await s.pause(700);
    await shotNoToasts(s, "builder", dialog, 0);
    await s.caption("The last screen's button sends every answer to the chat", 400);
    await retype(s, dialog.getByRole("textbox", { name: "Submit button" }), "Request visit");

    await s.caption("Try it in the preview, as the customer would", 400);
    await s.click(dialog.getByRole("button", { name: "Go to screen 1" }), 900);
    await s.type(dialog.getByRole("textbox", { name: "Full name", exact: true }), "Priya Sharma");
    await s.click(dialog.getByRole("button", { name: "Continue", exact: true }), 1000);
    const project = dialog.getByRole("combobox", { name: "Project", exact: true });
    await s.click(project, 200);
    await project.selectOption({ label: "Green Acres Villas" });
    await s.pause(400);
    const date = dialog.getByLabel("Preferred visit date", { exact: true }).last();
    await s.click(date, 200);
    await date.fill("2026-10-04");
    await s.pause(400);
    await s.click(dialog.getByRole("button", { name: "Request visit", exact: true }), 1200);
    await s.caption("The preview shows the message your assistant reads", 1800);
    await shotNoToasts(s, "preview-response", dialog.getByText("Response sent").locator("xpath=ancestor::aside[1]"), 0);

    await s.caption("View as JSON shows the Flow JSON Ringg sends to Meta", 400);
    await s.click(dialog.getByRole("tab", { name: "View as JSON" }), 1600);
    await shotNoToasts(s, "flow-json", dialog, 0);
    await s.click(dialog.getByRole("tab", { name: "Edit flow" }), 600);

    await s.caption("Click Save draft", 400);
    await s.click(dialog.getByRole("button", { name: "Save draft" }), 2200);
    await s.caption("The saved draft stays open for editing. Click Cancel to see its details", 400);
    await s.click(p.getByRole("dialog").getByRole("button", { name: "Cancel" }), 1200);
    await shotNoToasts(s, "draft-details", p.getByRole("dialog"), 0);
    await s.caption("Click Publish, then Publish again to confirm", 400);
    await s.click(p.getByRole("button", { name: "Publish Flow" }), 700);
    await s.click(p.getByRole("button", { name: "Confirm publish" }), 2000);
    await s.caption("Published Flows are locked. Duplicate & edit makes a new draft", 900);
    await shotNoToasts(s, "published", p.getByRole("dialog"), 0);
    await s.click(p.getByRole("button", { name: "Duplicate & edit" }), 2000);
    await s.caption("The copy opens in the builder, named (copy)", 1800);
  },
} satisfies Scenario;
