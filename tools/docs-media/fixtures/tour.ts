// Dashboard tour: every sidebar section renders with data. Reuses the section owners' fixtures (read-only imports).
import { agentRoutes } from "./agents.ts";
import { kbRoutes as editorKbRoutes } from "./agents-create.ts";
import { workflowRoutes } from "./workflows.ts";
import { logsRoutes } from "./monitor.ts";
import { campaignRoutes } from "./campaigns.ts";
import { analyticsRoutes } from "./monitor-analytics.ts";
import { kbRoutes } from "./kb.ts";
import { makeNumbersRoutes } from "./numbers.ts";
import { makeEditorBRoutes } from "./editor-b.ts";
import { membersRoutes } from "./account.ts";
import { alertsRoutes } from "./monitor-alerts.ts";

const editorB = makeEditorBRoutes() as Record<string, unknown>;
const pick = (from: Record<string, unknown>, prefixes: string[]) => Object.fromEntries(Object.entries(from).filter(([k]) => prefixes.some((p) => k.startsWith(p))));

export const tourRoutes = {
  ...editorKbRoutes,
  ...workflowRoutes,
  ...logsRoutes,
  ...campaignRoutes,
  ...analyticsRoutes,
  ...alertsRoutes,
  ...kbRoutes,
  ...makeNumbersRoutes(),
  // Tools page: the workspace tool library and integrations catalog.
  ...pick(editorB, ["GET /workspace-tools", "GET /integrations", "GET /whatsapp/embedded-signup"]),
  "GET /whatsapp/embedded-signup/accounts": { accounts: [] },
  ...membersRoutes(),
  ...agentRoutes,
};
