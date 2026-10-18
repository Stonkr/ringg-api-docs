import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Scenario } from "../run.ts";
import { BASE } from "../lib.ts";
import { shotNoToasts } from "../fixtures/editor-b.ts";
import { WA_ACCOUNT_ID, whatsappAccountRoutes } from "../fixtures/whatsapp.ts";
import { FLOW_IDS, makeWhatsappFlowRoutes } from "../fixtures/whatsapp-flows.ts";

const DOCS_PAGE = "documentation/build-agents/agents/whatsapp-agents/flows-live-data";
// The booking design the page tells readers to copy, so the video pastes exactly what the docs show.
const bookingDesign = readFileSync(resolve(import.meta.dirname, `../../../${DOCS_PAGE}.mdx`), "utf8").split("```json")[1].split("```")[0];

// Pastes the booking design into the builder, saves it, connects Google Calendar as its data source and publishes it.
export default {
  name: "whatsapp-flows-live-data",
  docsPage: DOCS_PAGE,
  routes: { "GET /workspace/features": {}, ...whatsappAccountRoutes, ...makeWhatsappFlowRoutes({ without: [FLOW_IDS.bookVisit] }) },
  async run(s) {
    const p = s.page;
    await p.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(BASE).origin });
    await s.goto(`/integrations/whatsapp/${WA_ACCOUNT_ID}`);
    await s.caption("Open your WhatsApp account, select Flows, then Create Flow", 500);
    await s.click(p.getByRole("tab", { name: "Flows" }), 900);
    await s.click(p.getByRole("button", { name: "Create a Flow" }).first(), 1000);

    const dialog = p.getByRole("dialog");
    await s.caption("Name it and choose Appointment booking", 400);
    await s.type(dialog.getByRole("textbox", { name: "Flow name" }), "Book a visit");
    await s.click(dialog.getByRole("button", { name: /Category/ }), 500);
    await s.click(p.getByRole("option", { name: "Appointment booking" }), 700);

    await s.caption("Copy the booking design from this page, then click Paste JSON", 400);
    await p.evaluate((text) => navigator.clipboard.writeText(text), bookingDesign);
    await s.click(dialog.getByRole("button", { name: "Paste JSON" }), 1200);
    await s.caption("Both screens arrive. Parts that read live data stay as JSON", 1800);
    await shotNoToasts(s, "pasted-design", dialog, 0);
    await s.caption("Click Save draft, then Cancel to see its details", 400);
    await s.click(dialog.getByRole("button", { name: "Save draft" }), 1800);
    await s.click(p.getByRole("dialog").getByRole("button", { name: "Cancel" }), 1200);

    const details = p.getByRole("dialog");
    await s.caption("Under Data source, click Set up data source", 400);
    await s.click(details.getByRole("button", { name: "Set up data source" }), 900);
    await s.caption("Keep Calendar and pick your connected calendar", 400);
    await s.click(details.getByRole("button", { name: /Pick a connected calendar/ }), 600);
    await s.click(p.getByRole("option", { name: "Google Calendar (Site visits)" }), 900);
    await s.caption("The date and slots screens are already picked. Check the timezone", 2000);
    await details.getByRole("textbox", { name: "Timezone" }).evaluate((e) => e.scrollIntoView({ block: "center", behavior: "smooth" }));
    await s.pause(800);
    await shotNoToasts(s, "calendar-source", details, 0);
    await s.caption("Click Save", 400);
    await s.click(details.getByRole("button", { name: "Save data source" }), 2000);
    await s.caption("The Flow now reads free slots from the calendar", 1600);

    await s.caption("Click Publish, then Publish again to confirm", 400);
    await s.click(details.getByRole("button", { name: "Publish Flow" }), 700);
    await s.click(details.getByRole("button", { name: "Confirm publish" }), 1800);
    await s.click(details.getByRole("button", { name: "Close" }).first(), 1000);
    await s.caption("Live data shows Calendar, via Ringg", 1800);
    await shotNoToasts(s, "flows-tab", p.getByRole("grid", { name: "WhatsApp Flows" }), 8);
  },
} satisfies Scenario;
