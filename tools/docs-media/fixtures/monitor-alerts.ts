// Alerts fixtures: metric catalog, existing rules (stateful: a saved alert appears in the list), notification test.
import { agentRoutes } from "./agents.ts";
import { NOW } from "./common.ts";

const callFilters = ["call_type", "status", "calling_source"];
const catalog = {
  items: [
    { id: "calls.disconnection_rate", label: "Disconnection rate", description: "Share of calls that dropped before the conversation finished.", source: "calls", unit: "%", agg: "rate", supported_group_bys: [], filterable_fields: callFilters, scope: "both", requires_analysis_key: false, default_threshold: 0.25 },
    { id: "calls.hangup_by_customer_rate", label: "Customer hangup rate", description: "Share of connected calls the customer hung up on.", source: "calls", unit: "%", agg: "rate", supported_group_bys: [], filterable_fields: callFilters, scope: "both", requires_analysis_key: false, default_threshold: 0.25 },
    { id: "calls.failure_rate", label: "Call failure rate", description: "Share of calls that ended as failed or error.", source: "calls", unit: "%", agg: "rate", supported_group_bys: [], filterable_fields: callFilters, scope: "both", requires_analysis_key: false, default_threshold: 0.2 },
    { id: "calls.count", label: "Call volume", description: "Number of calls in the window.", source: "calls", unit: "calls", agg: "count", supported_group_bys: [], filterable_fields: callFilters, scope: "both", requires_analysis_key: false, default_threshold: null },
    { id: "calls.avg_duration", label: "Average call duration", description: "Mean duration of connected calls, in seconds.", source: "calls", unit: "s", agg: "avg", supported_group_bys: [], filterable_fields: callFilters, scope: "both", requires_analysis_key: false, default_threshold: null },
    { id: "tools.failure_rate", label: "Tool failure rate", description: "Share of tool calls that returned an error.", source: "tools", unit: "%", agg: "rate", supported_group_bys: [], filterable_fields: ["tool_name", "call_type"], scope: "agent", requires_analysis_key: false, default_threshold: 0.1 },
    { id: "billing.available_balance", label: "Credit balance", description: "Workspace balance at check time.", source: "billing", unit: "INR", agg: "gauge", supported_group_bys: [], filterable_fields: [], scope: "workspace", requires_analysis_key: false, default_threshold: 5000 },
    { id: "client_analysis.share", label: "Custom analysis share", description: "", source: "client_analysis", unit: "%", agg: "rate", supported_group_bys: [], filterable_fields: callFilters, scope: "agent", requires_analysis_key: true, default_threshold: null },
    { id: "client_analysis.count", label: "Custom analysis count", description: "", source: "client_analysis", unit: "calls", agg: "count", supported_group_bys: [], filterable_fields: callFilters, scope: "agent", requires_analysis_key: true, default_threshold: null },
    { id: "client_analysis.numeric", label: "Custom analysis value", description: "", source: "client_analysis", unit: "", agg: "avg", supported_group_bys: [], filterable_fields: callFilters, scope: "agent", requires_analysis_key: true, default_threshold: null },
  ],
};

const channel = (id: string, type: "email" | "slack" | "webhook", config: Record<string, unknown>) => ({ id, workspace_id: "ws_demo", channel_type: type, config, name: null, is_active: true });
const rule = (r: Record<string, unknown>) => ({
  workspace_id: "ws_demo", is_default: false, agent_ids: null, metric_config: null, filter_json: {}, window_minutes: 30, evaluate_every_minutes: 15,
  condition_type: "gt", severity: "warning", enabled: true, last_evaluated_at: NOW, channel_ids: [], created_at: "2026-09-12T06:00:00Z", updated_at: NOW, ...r,
});

const initialRules = () => [
  rule({ id: "alr_disconnect", name: "Disconnection rate spike", is_default: true, metric_id: "calls.disconnection_rate", threshold: 0.25, channels: [channel("nch_ops_mail", "email", { recipients: ["ops@acme-lending.example"] })] }),
  rule({ id: "alr_balance", name: "Low credit balance", metric_id: "billing.available_balance", condition_type: "lt", threshold: 5000, window_minutes: 0, evaluate_every_minutes: 60, channels: [channel("nch_fin_mail", "email", { recipients: ["finance@acme-lending.example"] })] }),
  rule({ id: "alr_tool", name: "Payment link tool failing", metric_id: "tools.failure_rate", agent_ids: ["agt_payment_reminder"], threshold: 0.1, filter_json: { tool_name: "schedule_payment_link" }, channels: [channel("nch_hook", "webhook", { url: "https://hooks.acme-lending.example/ringg-alerts", has_headers: true })] }),
];

let rules = initialRules();
let seq = 0;

function save(body: any, id?: string) {
  const notify = body?.notify ?? { emails: [], slack_channels: [], webhooks: [] };
  // A toggle PATCH sends no notify block: keep the rule's channels.
  const channels = !body?.notify && body?.channels ? body.channels : [
    ...notify.emails.map((e: string, i: number) => channel(`nch_new_mail_${i}`, "email", { recipients: [e] })),
    ...notify.webhooks.map((w: { url: string; headers?: object }, i: number) => channel(`nch_new_hook_${i}`, "webhook", { url: w.url, has_headers: !!w.headers && Object.keys(w.headers).length > 0 })),
  ];
  const saved = rule({ ...body, id: id ?? `alr_new_${++seq}`, enabled: body?.enabled ?? true, channels, notify: undefined, created_at: NOW });
  rules = id ? rules.map((r) => (r.id === id ? saved : r)) : [...rules, saved];
  return saved;
}

export const alertsRoutes = {
  ...agentRoutes,
  "GET /metrics-catalog": catalog,
  // Each scenario run starts from the initial set (the list is the first call on page load).
  "GET /alerts/rules": () => rules,
  "GET /alerts/rules/*": (url: URL) => rules.find((r) => r.id === url.pathname.split("/").at(-1)),
  "POST /alerts/rules": (_url: URL, body: unknown) => save(body),
  "PATCH /alerts/rules/*": (url: URL, body: unknown) => {
    const id = url.pathname.split("/").at(-1)!;
    const current = rules.find((r) => r.id === id);
    return save({ ...current, ...(body as object) }, id);
  },
  "POST /notifications/channels/test": { ok: true, error: null },
  "GET /integrations": [],
  "GET /analytics/v4/cohort/dimensions": { reserved: [], client_analysis: [{ path: "client_analysis", key: "payment_promised", label: "Payment promised", type: "boolean" }] },
  "GET /agent/*/tools": [],
};

/** Resets the stateful rule list (call at the start of a scenario). */
export function resetAlerts() {
  rules = initialRules();
  seq = 0;
}
