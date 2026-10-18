import type { Scenario } from "../run.ts";
import { shotNoToasts } from "../fixtures/editor-b.ts";
import { WA_ACCOUNT_ID, whatsappAccountRoutes } from "../fixtures/whatsapp.ts";
import { makeWhatsappFlowRoutes } from "../fixtures/whatsapp-flows.ts";

// Points a WhatsApp Manager Flow's data source at the customer's server and shows the signing secret once.
export default {
  name: "whatsapp-flows-your-server",
  docsPage: "documentation/build-agents/agents/whatsapp-agents/flows-your-server",
  routes: { "GET /workspace/features": {}, ...whatsappAccountRoutes, ...makeWhatsappFlowRoutes() },
  async run(s) {
    const p = s.page;
    await s.goto(`/integrations/whatsapp/${WA_ACCOUNT_ID}`);
    await s.caption("Open your WhatsApp account, select Flows and open the Flow", 500);
    await s.click(p.getByRole("tab", { name: "Flows" }), 900);
    await s.click(p.getByText("Find a showroom", { exact: true }), 1400);

    const details = p.getByRole("dialog");
    await s.caption("Under Data source, click Set up data source", 400);
    await s.click(details.getByRole("button", { name: "Set up data source" }), 900);
    await s.caption("Choose Server and enter your endpoint's URL", 400);
    await s.click(details.getByText("Server", { exact: true }), 600);
    await s.type(details.getByRole("textbox", { name: "Server URL" }), "https://api.acme-lending.example/whatsapp-flow");
    await shotNoToasts(s, "server-source", details, 0);
    await s.caption("Click Save", 400);
    await s.click(details.getByRole("button", { name: "Save data source" }), 2000);
    await s.caption("Copy the signing secret now: it is shown only once", 1800);
    await shotNoToasts(s, "signing-secret", details, 0);
    await s.click(details.getByRole("button", { name: "Copy the signing secret" }), 1000);

    await s.caption("Lost it? Edit the source and issue a new signing secret", 400);
    await s.click(details.getByRole("button", { name: "Edit source" }), 900);
    await s.hover(details.getByText("Issue a new signing secret", { exact: true }), 1600);
    await s.click(details.getByRole("button", { name: "Cancel" }).first(), 800);
  },
} satisfies Scenario;
