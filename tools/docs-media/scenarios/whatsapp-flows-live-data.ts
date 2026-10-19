import type { Scenario } from "../run.ts";
import { shotNoToasts } from "../fixtures/editor-b.ts";
import { WA_ACCOUNT_ID, whatsappAccountRoutes } from "../fixtures/whatsapp.ts";
import { FLOW_IDS, makeWhatsappFlowRoutes } from "../fixtures/whatsapp-flows.ts";

// Creates a booking Flow from the Appointment booking template, connects Google Calendar as its data source and publishes it.
export default {
  name: "whatsapp-flows-live-data",
  docsPage: "documentation/build-agents/agents/whatsapp-agents/flows-live-data",
  routes: { "GET /workspace/features": {}, ...whatsappAccountRoutes, ...makeWhatsappFlowRoutes({ without: [FLOW_IDS.bookVisit] }) },
  async run(s) {
    const p = s.page;
    await s.goto(`/integrations/whatsapp/${WA_ACCOUNT_ID}`);
    await s.caption("Open your WhatsApp account, select Flows, then Create Flow", 500);
    await s.click(p.getByRole("tab", { name: "Flows" }), 900);
    await s.click(p.getByRole("button", { name: "Create a Flow" }).first(), 1000);

    const dialog = p.getByRole("dialog");
    await s.caption("Select Templates, then Appointment booking", 400);
    await s.click(dialog.getByRole("button", { name: "Start from a template" }), 600);
    await s.click(p.getByRole("menuitem", { name: "Start from Appointment booking" }), 1000);
    await s.caption("Page 1's button loads the free times from the calendar", 400);
    await s.click(dialog.getByRole("button", { name: "Edit Date picker" }), 1600);
    await s.caption("On page 2, the times come from the data source", 400);
    await s.click(dialog.getByRole("button", { name: "Next screen" }).first(), 900);
    await s.click(dialog.getByRole("button", { name: "Edit Single choice" }), 1400);
    await shotNoToasts(s, "template-builder", dialog, 0);

    await s.caption("Click Save draft, then Cancel to see its details", 400);
    await s.click(dialog.getByRole("button", { name: "Save draft" }), 1800);
    await s.click(p.getByRole("dialog").getByRole("button", { name: "Cancel" }), 1200);

    const details = p.getByRole("dialog");
    await s.caption("Under Data source, click Set up data source", 400);
    await s.click(details.getByRole("button", { name: "Set up data source" }), 900);
    await s.caption("Keep Calendar and pick your connected calendar", 400);
    await s.click(details.getByRole("button", { name: /Pick a connected calendar/ }), 600);
    await s.click(p.getByRole("option", { name: "Google Calendar (Site visits)" }), 900);
    await s.caption("The pages and the date question are already filled in. Check the timezone", 2000);
    await details.getByRole("textbox", { name: "Timezone" }).evaluate((e) => e.scrollIntoView({ block: "center", behavior: "smooth" }));
    await s.pause(800);
    await shotNoToasts(s, "calendar-source", details, 0);
    await s.caption("Click Save", 400);
    await s.click(details.getByRole("button", { name: "Save data source" }), 2000);
    await s.caption("The Flow now reads free slots from the calendar", 1400);

    await s.caption("Click Publish, then Publish again to confirm", 400);
    await s.click(details.getByRole("button", { name: "Publish Flow" }), 700);
    await s.click(details.getByRole("button", { name: "Confirm publish" }), 1800);
    await s.click(details.getByRole("button", { name: "Close" }).first(), 1000);
    await s.caption("Live data shows Calendar, via Ringg", 1800);
    await shotNoToasts(s, "flows-tab", p.getByRole("grid", { name: "WhatsApp Flows" }), 8);
  },
} satisfies Scenario;
