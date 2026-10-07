// Workflows fixtures: list, versions, graphs, runs and traces. Fictional data for "Acme Lending".
// Shapes follow app-main lib/api/workflows.api.ts and types/workflow*.types.ts.
import { NOW } from "./common.ts";
import { agentRoutes } from "./agents.ts";
import { calls as historyCalls, FEATURED_CALL_ID, logsRoutes } from "./monitor.ts";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const workspaceNumbers = [
  { id: "num_blr_1", number: "+91 98765 40300", created_at: "2026-06-02T09:00:00Z", agent: { id: "agt_payment_reminder", agent_display_name: "Payment reminder" }, is_inbound_enabled: false, is_test_number: false, spam_message: "", tags: [], is_custom_number: false, owner: "ringg", telephony_id: "tel_1", provider: "ringg", number_pool_id: null, isExpired: false, expiry_date: "2027-06-02T09:00:00Z" },
  { id: "num_blr_2", number: "+91 98765 40301", created_at: "2026-06-02T09:00:00Z", agent: { id: "agt_lead_callback", agent_display_name: "Lead qualification" }, is_inbound_enabled: false, is_test_number: false, spam_message: "", tags: [], is_custom_number: false, owner: "ringg", telephony_id: "tel_1", provider: "ringg", number_pool_id: null, isExpired: false, expiry_date: "2027-06-02T09:00:00Z" },
  { id: "num_mum_1", number: "+91 98765 40302", created_at: "2026-07-14T09:00:00Z", agent: { id: "agt_support_line", agent_display_name: "Support line" }, is_inbound_enabled: true, is_test_number: false, spam_message: "", tags: [], is_custom_number: false, owner: "ringg", telephony_id: "tel_1", provider: "ringg", number_pool_id: null, isExpired: false, expiry_date: "2027-07-14T09:00:00Z" },
];

const permanentVars = [{ name: "callee_name" }, { name: "callee_number" }];

/** The flagship workflow: call, branch on promise to pay, update CRM or wait a day and WhatsApp. */
const paymentFollowup = {
  id: "wf_payment_followup",
  workspace_id: "ws_demo",
  name: "Payment reminder follow-up",
  description: "Call borrowers with an EMI due, log promises to pay in the CRM, and follow up on WhatsApp the next day.",
  status: "active",
  entry_node_id: "n_call",
  variables_config: { variables: [...permanentVars, { name: "loan_id" }, { name: "due_amount", default: "₹12,500" }] },
  nodes: [
    { id: "n_call", ui_meta: { x: 0, y: 0, start: { x: -260, y: 120 } }, name: "Payment reminder", type: "call", order_hint: 0, config: { agent_id: "agt_payment_reminder", from_number_ids: ["num_blr_1"], call_config: { call_retry_config: { retry_count: 2, retry_busy: 15, retry_not_picked: 30, retry_failed: 60 }, call_time: { call_start_time: "10:00", call_end_time: "19:00", timezone: "Asia/Kolkata" } }, variable_mapping: { callee_name: "{{callee.name}}", due_amount: "{{due_amount}}" } } },
    { id: "n_cond", ui_meta: { x: 380, y: 40 }, name: "Promised to pay?", type: "logic", order_hint: 1, config: { mode: "all", condition_groups: [{ mode: "all", conditions: [{ variable: "agent.n_call.client_analysis.payment_promised", operator: "==", value: "true" }] }] } },
    { id: "n_crm", ui_meta: { x: 860, y: -140 }, name: "Log promise in CRM", type: "data", order_hint: 2, config: { http: { method: "POST", url: "https://crm.acme-lending.example/api/loans/{{loan_id}}/promise", headers: { "Content-Type": "application/json" }, body: { status: "promised" }, timeout_seconds: 15 }, integration_id: null } },
    { id: "n_wait", ui_meta: { x: 860, y: 300 }, name: "Wait a day", type: "await", order_hint: 3, config: { mode: "duration", duration: { amount: 1, unit: "days" }, scope: "per_person", respect_call_window: true } },
    { id: "n_wa", ui_meta: { x: 1240, y: 260 }, name: "WhatsApp nudge", type: "message", order_hint: 4, config: { channel: "whatsapp", agent_id: "agt_whatsapp", phone_number_id: "wa_100200300", template: { name: "emi_due_reminder" } } },
  ],
  edges: [
    { id: "e1", source_node_id: "n_call", target_node_id: "n_cond", condition_key: "next" },
    { id: "e2", source_node_id: "n_cond", target_node_id: "n_crm", condition_key: "true" },
    { id: "e3", source_node_id: "n_cond", target_node_id: "n_wait", condition_key: "false" },
    { id: "e4", source_node_id: "n_wait", target_node_id: "n_wa", condition_key: "next" },
  ],
};

export const workflowList = [
  { id: "wf_payment_followup", name: paymentFollowup.name, description: paymentFollowup.description, status: "active", updated_at: ago(140), entry_node_id: "n_call" },
  { id: "wf_lead_nurture", name: "Home loan lead nurture", description: "Qualify new home-loan leads by phone, wait two days, then send the eligibility checklist on WhatsApp.", status: "active", updated_at: ago(60 * 26), entry_node_id: "n_call" },
  { id: "wf_kyc_chase", name: "KYC document chase", description: "Remind applicants to upload PAN and address proof, and escalate to a loan officer after three attempts.", status: "draft", updated_at: ago(35), entry_node_id: "n_call" },
  { id: "wf_emi_bounce", name: "EMI bounce recovery", description: "Call borrowers whose auto-debit bounced and share a payment link by SMS.", status: "draft", updated_at: ago(60 * 50), entry_node_id: "n_call" },
];

const version = (id: string, slug: string, status: "draft" | "published", active: boolean, minutes: number) => ({ version_id: id, version_slug: slug, status, is_active: active, created_at: ago(minutes), updated_at: ago(minutes) });

export const versionsById: Record<string, unknown> = {
  wf_payment_followup: { workflow_id: "wf_payment_followup", active_version_id: "ver_pf_2", versions: [version("ver_pf_2", "v2", "published", true, 140), version("ver_pf_1", "v1", "published", false, 60 * 72)] },
  wf_lead_nurture: { workflow_id: "wf_lead_nurture", active_version_id: "ver_ln_1", versions: [version("ver_ln_2", "v2", "draft", false, 60 * 26), version("ver_ln_1", "v1", "published", true, 60 * 96)] },
  wf_kyc_chase: { workflow_id: "wf_kyc_chase", active_version_id: null, versions: [version("ver_kyc_1", "v1", "draft", false, 35)] },
  wf_emi_bounce: { workflow_id: "wf_emi_bounce", active_version_id: null, versions: [version("ver_eb_1", "v1", "draft", false, 60 * 50)] },
};

const run = (id: string, status: string, name: string, number: string, calls: number, startedMin: number, updatedMin: number, workflow = "wf_payment_followup") => ({
  run_id: id, workflow_id: workflow, status, outcome: null, outcome_note: status === "failed" ? "flow_http failed: 503 Service Unavailable from crm.acme-lending.example" : null,
  callee_id: `cle_${id}`, callee_name: name, callee_number: number, call_count: calls, started_at: ago(startedMin), updated_at: ago(updatedMin),
});

export const workflowRuns = [
  run("run_8f2a91", "completed", "Rahul Verma", "+91 98765 41023", 1, 42, 38),
  run("run_8f2a90", "active", "Ananya Iyer", "+91 98765 43317", 1, 44, 41),
  run("run_8f2a8e", "completed", "Vikram Nair", "+91 98765 40562", 2, 47, 21),
  run("run_7c11d4", "completed", "Sneha Kulkarni", "+91 98765 44871", 1, 63, 58, "wf_lead_nurture"),
  run("run_7c11d3", "failed", "Arjun Mehta", "+91 98765 42093", 1, 66, 61),
  run("run_7c11d2", "completed", "Kavya Reddy", "+91 98765 45126", 1, 71, 66, "wf_lead_nurture"),
  run("run_6b0e77", "cancelled", "Imran Sheikh", "+91 98765 46630", 0, 125, 120),
  run("run_6b0e76", "completed", "Meera Pillai", "+91 98765 47714", 2, 130, 90),
];

type TraceStatus = "done" | "running" | "failed" | "skipped";
const trace = (runId: string, run_status: string, statuses: Record<string, TraceStatus>) => ({
  run_id: runId, run_status, outcome: null,
  current_node_id: Object.entries(statuses).find(([, st]) => st === "running")?.[0] ?? null,
  nodes: paymentFollowup.nodes.map((n) => ({ node_id: n.id, type: n.type, status: statuses[n.id] ?? "skipped" })),
});

/** Per run: Match path (promise logged), No match path (waited, then WhatsApp), a CRM failure, a live run. */
const traces: Record<string, (id: string) => unknown> = {
  run_8f2a90: (id) => trace(id, "active", { n_call: "done", n_cond: "done", n_wait: "running" }),
  run_8f2a8e: (id) => trace(id, "completed", { n_call: "done", n_cond: "done", n_wait: "done", n_wa: "done" }),
  run_7c11d3: (id) => trace(id, "failed", { n_call: "done", n_cond: "done", n_crm: "failed" }),
};
const runTrace = (runId: string) => (traces[runId] ?? ((id: string) => trace(id, "completed", { n_call: "done", n_cond: "done", n_crm: "done" })))(runId);

/** The call a run placed: the Logs featured call (Rahul Verma promises to pay), as a workflow call. */
const featuredCall = historyCalls.find((c) => c.id === FEATURED_CALL_ID)!;
const runCall = { ...featuredCall, bulk_list_id: "", from_numbers: ["+919876540300"] };
const callAnalysisRoutes = Object.fromEntries(
  ["GET /calling/analysis/*", "GET /calling/call-details", "GET /tools/call-logs/*", "GET /evals/observability/calls/*/results", "POST /calling/*/call-feedback"].map((k) => [k, (logsRoutes as Record<string, unknown>)[k]]),
);

/** Agent detail: variables and Advanced Analysis keys (the Condition block's Custom analysis fields). */
const analysisKey = (type: string, label: string, description: string) => ({ type, label, description });
const agentDetail = (id: string) => {
  const reminder = id === "agt_payment_reminder";
  return {
    agents: {
      id, active_agent_version_id: "agv_1",
      version_details: {
        agv_1: {
          agent_config: { custom_variables: reminder ? ["callee_name", "due_amount"] : [] },
          client_analysis: { keys: reminder ? { payment_promised: analysisKey("boolean", "Payment promised", "Borrower agreed to pay by the due date"), promised_date: analysisKey("string", "Promised date", "Date the borrower promised to pay") } : {} },
        },
      },
    },
  };
};

export const workflowNodeTypes = { node_types: [], blocks: [] };

/** Routes for the Workflows list, an existing workflow, and Logs → Workflows. */
export const workflowRoutes = {
  ...agentRoutes,
  "GET /workflow/node-types": workflowNodeTypes,
  "GET /workflow": { items: workflowList, total: workflowList.length, limit: 30, offset: 0, has_more: false },
  "GET /workflow/*/versions": (url: URL) => versionsById[url.pathname.split("/").at(-2)!] ?? { workflow_id: "", active_version_id: null, versions: [] },
  "GET /workflow/*": (url: URL) => {
    const id = url.pathname.split("/").at(-1)!;
    const item = workflowList.find((w) => w.id === id);
    return { ...paymentFollowup, id, name: item?.name ?? paymentFollowup.name, status: item?.status ?? "active" };
  },
  "GET /workflow/runs": { items: workflowRuns, limit: 25, offset: 0, has_more: false },
  "GET /workflow/runs/*/trace": (url: URL) => runTrace(url.pathname.split("/").at(-2)!),
  "GET /calling/history/v2": (url: URL) => {
    const run = url.searchParams.get("workflow_run_id"), callId = url.searchParams.get("call_id");
    const list = run === "run_8f2a91" || run === "run_7c11d3" || callId === FEATURED_CALL_ID ? [runCall] : [];
    return { calls: list, total: list.length, count: list.length, limit: 50, offset: 0 };
  },
  ...callAnalysisRoutes,
  "GET /workspace/numbers": { workspace_numbers: workspaceNumbers },
  "GET /integrations": [],
  "GET /workspace/call-frequency-cap": { status: "success", enabled: false, max_calls: 3, window_minutes: 1440 },
  "GET /workspace/call-frequency-cap/agent/*": (url: URL) => ({ status: "success", agent_id: url.pathname.split("/").at(-1), enabled: false, max_calls: 3, window_minutes: 1440, workspace: { enabled: false, max_calls: 3, window_minutes: 1440 } }),
  "GET /agent/*": (url: URL) => agentDetail(url.pathname.split("/").at(-1)!),
  "POST /workflow/*/nodes/*/agent-variables": (url: URL) => ({
    workflow_id: url.pathname.split("/")[2], node_id: url.pathname.split("/")[4], agent_id: "agt_payment_reminder",
    required_variables: [
      { name: "callee_name", required: true, mapped: false, current_value: "{{callee.name}}" },
      { name: "due_amount", required: true, mapped: false, current_value: null },
    ],
    available_sources: { workflow_variables: ["callee_name", "callee_number", "due_amount"], prior_nodes: [] },
    inject_previous_summary: true, summary_variable_name: "summary", suggested_summary_source_node_id: null,
  }),
};

export { NOW };
