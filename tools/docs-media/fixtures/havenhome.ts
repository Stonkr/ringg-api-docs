// HavenHome (fictional mattress retailer) fixtures for the assisted purchase journey tutorial.
// Stateful: create → save → publish → test run. Shapes follow app-main lib/api/workflows.api.ts,
// types/workflow*.types.ts and types/agent.types.ts. All names, numbers and URLs are fictional.
import { workflowRoutes } from "./workflows.ts";

const NOW = "2026-10-06T10:30:00Z";
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const workspace = {
  id: "ws_demo", name: "HavenHome", api_key: "", total_available_credits: 18000, account_type: "company", currency: "INR", entity_type: "company",
  updated_at: NOW, created_at: "2026-06-01T09:00:00Z", archived_at: "", is_archived: false, bulk_api_key: "", free_generations: 0, subscription_type: "prepaid",
  workspace_config: { custom_voices: [] }, credits: 18000, new_billing_enabled: true, is_onboarded: true, is_kyc_done: true, is_enterprise: false,
  is_international_calls_enabled: false, parent_workspace_id: null,
};
const user = { id: "usr_demo", name: "Priya Sharma", email: "priya@havenhome.example", avatar: null, created_at: "2026-06-01T09:00:00Z", user_workspace_id: "ws_demo" };
const meWorkspace = { id: workspace.id, name: workspace.name, role: "owner", credits: workspace.credits, created_at: workspace.created_at };

const base = { voice_avatar: "", template_icon: "", template_source: "ringg", created_at: "2026-09-01T10:00:00Z", updated_at: NOW, call_frequency_cap: null };
export const hhAgents = [
  { ...base, id: "agt_hh_store_guide", agent_display_name: "HavenHome store guide", agent_type: "outbound", orchestration_mode: "single_node", template_name: "custom", template_label: "Custom", template_type: "outbound" },
  { ...base, id: "agt_hh_comparison", agent_display_name: "HavenHome comparison advisor", agent_type: "outbound", orchestration_mode: "single_node", template_name: "custom", template_label: "Custom", template_type: "outbound" },
  { ...base, id: "agt_hh_whatsapp", agent_display_name: "HavenHome WhatsApp concierge", agent_type: "whatsapp", orchestration_mode: "single_node", template_name: "whatsapp", template_label: "WhatsApp", template_type: "whatsapp" },
  { ...base, id: "agt_hh_website", agent_display_name: "Website sleep advisor", agent_type: "inbound", orchestration_mode: "single_node", template_name: "webcall", template_label: "Website assistant", template_type: "webcall" },
  { ...base, id: "agt_hh_delivery", agent_display_name: "Delivery confirmation", agent_type: "outbound", orchestration_mode: "single_node", template_name: "custom", template_label: "Custom", template_type: "outbound" },
];

const key = (type: string, label: string, description: string) => ({ type, label, description });
const agentInfo: Record<string, { custom_variables: string[]; keys: Record<string, unknown> }> = {
  agt_hh_store_guide: {
    custom_variables: ["chat_summary", "shortlisted_products", "mattress_size", "sleep_style", "city"],
    keys: {
      whatsapp_consent: key("boolean", "WhatsApp consent", "Customer agreed to receive store details on WhatsApp"),
      recommended_store: key("string", "Recommended store", "Store suggested to the customer"),
      visit_intent: key("enum", "Visit intent", "How likely the customer is to visit"),
    },
  },
  agt_hh_comparison: {
    custom_variables: ["chat_summary", "shortlisted_products", "products_tried", "objections", "visit_outcome"],
    keys: { ready_to_buy: key("boolean", "Ready to buy", "Customer is ready to purchase"), preferred_product: key("string", "Preferred product", "Product the customer prefers") },
  },
  agt_hh_whatsapp: { custom_variables: [], keys: {} },
};

const agentDetail = (id: string) => {
  const info = agentInfo[id] ?? { custom_variables: [], keys: {} };
  return { agents: { id, active_agent_version_id: "agv_1", version_details: { agv_1: { agent_config: { custom_variables: info.custom_variables }, client_analysis: { keys: info.keys } } } } };
};

const number = (id: string, n: string, agentId: string, agentName: string) => ({
  id, number: n, created_at: "2026-06-02T09:00:00Z", agent: { id: agentId, agent_display_name: agentName }, is_inbound_enabled: false, is_test_number: false, spam_message: "", tags: [],
  is_custom_number: false, owner: "ringg", telephony_id: "tel_1", provider: "ringg", number_pool_id: null, isExpired: false, expiry_date: "2027-06-02T09:00:00Z",
});
const hhNumbers = [
  number("num_hh_1", "+91 98765 40110", "agt_hh_store_guide", "HavenHome store guide"),
  number("num_hh_2", "+91 98765 40111", "agt_hh_comparison", "HavenHome comparison advisor"),
  number("num_hh_3", "+91 98765 40112", "agt_hh_delivery", "Delivery confirmation"),
];

const hhWorkflows = [
  { id: "wf_hh_delivery", name: "Delivery slot confirmation", description: "Call customers a day before delivery to confirm the slot and floor access.", status: "active", updated_at: ago(180), entry_node_id: "n1" },
  { id: "wf_hh_trial", name: "100-night trial check-in", description: "Check in on night 30 of the sleep trial and offer an exchange if needed.", status: "active", updated_at: ago(60 * 30), entry_node_id: "n1" },
  { id: "wf_hh_cart", name: "Abandoned cart callback", description: "Call shoppers who left a mattress in the cart and send a WhatsApp follow-up.", status: "draft", updated_at: ago(60 * 52), entry_node_id: "n1" },
];

export const BUILD_ID = "wf_hh_assisted_purchase";
export const RUN_ID = "run_hh_7a21c4";

type WireNode = { id: string; type: string; name?: string; config?: Record<string, unknown> };
type WireEdge = { source_node_id: string; target_node_id: string; condition_key?: string };
type Wire = { name?: string; entry_node_id?: string; nodes?: WireNode[]; edges?: WireEdge[]; variables_config?: unknown };

const ACTION_FIELDS: Record<string, string[]> = {
  fetch: ["products_tried", "preferences", "objections", "visit_outcome"],
  status: ["purchase_status", "order_id", "amount_inr"],
};

/** Ordered path from the entry node, following `next`/`true` edges. */
const pathOf = (g: Wire | null) => {
  const out: string[] = [];
  let cur = g?.entry_node_id;
  while (cur && !out.includes(cur)) {
    out.push(cur);
    const e = (g?.edges ?? []).find((x) => x.source_node_id === cur && (x.condition_key === "next" || x.condition_key === "true" || !x.condition_key));
    cur = e?.target_node_id;
  }
  return out;
};

export function havenhomeRoutes() {
  const state = { graph: null as Wire | null, published: false, triggeredAt: 0, name: "Untitled workflow" };
  const ts = new Date().toISOString();
  const versions = () => ({
    workflow_id: BUILD_ID,
    active_version_id: state.published ? "ver_hh_1" : null,
    versions: state.graph ? [{ version_id: "ver_hh_1", version_slug: "v1", status: state.published ? "published" : "draft", is_active: state.published, created_at: ts, updated_at: ts }] : [],
  });
  const definition = () => ({ id: BUILD_ID, workspace_id: "ws_demo", name: state.name, description: null, status: state.published ? "active" : "draft", entry_node_id: state.graph?.entry_node_id ?? "", nodes: state.graph?.nodes ?? [], edges: state.graph?.edges ?? [], variables_config: state.graph?.variables_config });

  return {
    ...workflowRoutes,
    "GET /auth/me": { message: "ok", session_expires_at: Math.floor(Date.now() / 1000) + 86_400, user, user_workspaces: [meWorkspace], current_workspace: meWorkspace, is_new_user: false },
    "GET /workspace/all": { workspaces: [workspace] },
    "GET /workspace": { workspace_info: workspace },
    "GET /agent/all": { status: "success", data: { agents: hhAgents } },
    "GET /agent/all/call_counts": { status: "success", data: { call_counts: { agt_hh_store_guide: 842, agt_hh_comparison: 316, agt_hh_whatsapp: 1290, agt_hh_website: 2210, agt_hh_delivery: 655 } } },
    "GET /agent/*": (url: URL) => agentDetail(url.pathname.split("/").at(-1)!),
    "GET /workspace/numbers": { workspace_numbers: hhNumbers },
    "GET /integrations": [
      { integration_id: "int_hh_crm", provider_id: "custom", integration_name: "HavenHome CRM", category: "crm", status: "connected", status_message: "", tool_count: 0 },
      { integration_id: "int_hh_shop", provider_id: "custom", integration_name: "HavenHome Shop API", category: "ecommerce", status: "connected", status_message: "", tool_count: 0 },
    ],
    "GET /workflow": { items: hhWorkflows, total: hhWorkflows.length, limit: 30, offset: 0, has_more: false },
    "GET /workflow/runs": { items: [], limit: 25, offset: 0, has_more: false },
    "POST /workflow": (_u: URL, body: Wire) => {
      state.graph = body;
      state.name = body.name ?? state.name;
      return { id: BUILD_ID, name: state.name, entry_node_id: body.entry_node_id };
    },
    "PUT /workflow/*/graph": (_u: URL, body: Wire) => {
      state.graph = { ...state.graph, ...body };
      return { id: BUILD_ID, entry_node_id: body.entry_node_id, node_count: body.nodes?.length ?? 0, edge_count: body.edges?.length ?? 0 };
    },
    "PATCH /workflow": (_u: URL, body: { name?: string }) => {
      if (body?.name) state.name = body.name;
      return { id: BUILD_ID, name: state.name, status: state.published ? "active" : "draft" };
    },
    "GET /workflow/*/versions": versions,
    "GET /workflow/*": definition,
    "POST /workflow/*/publish": () => {
      state.published = true;
      return { status: "active" };
    },
    "POST /workflow/*/trigger": () => {
      state.triggeredAt = Date.now();
      return { run_id: RUN_ID, started: true };
    },
    "GET /workflow/runs/*/trace": () => {
      const path = pathOf(state.graph);
      const byId = new Map((state.graph?.nodes ?? []).map((n) => [n.id, n]));
      const reached = Math.min(path.length, Math.floor((Date.now() - state.triggeredAt) / 800));
      const done = reached >= path.length;
      const nodes = path.slice(0, Math.max(1, reached + 1)).map((id, i) => ({ node_id: id, type: byId.get(id)?.type ?? "call", status: i < reached ? "done" : "running" }));
      return { run_id: RUN_ID, run_status: done ? "completed" : "active", outcome: null, current_node_id: done ? null : path[reached], nodes: done ? nodes.map((n) => ({ ...n, status: "done" })) : nodes };
    },
    // What an Agent block's agent needs, and what it can be bound to (answered about the canvas in the body).
    "POST /workflow/*/nodes/*/agent-variables": (url: URL, body: Wire | undefined) => {
      const parts = url.pathname.split("/");
      const nodeId = decodeURIComponent(parts[parts.indexOf("nodes") + 1]);
      const g = body?.nodes ? body : state.graph;
      const node = g?.nodes?.find((n) => n.id === nodeId);
      const agentId = String(node?.config?.agent_id ?? "");
      const mapping = (node?.config?.variable_mapping ?? {}) as Record<string, string>;
      const incoming = new Map<string, string[]>();
      for (const e of g?.edges ?? []) incoming.set(e.target_node_id, [...(incoming.get(e.target_node_id) ?? []), e.source_node_id]);
      const up: string[] = [];
      const queue = [...(incoming.get(nodeId) ?? [])];
      while (queue.length) {
        const c = queue.shift()!;
        if (up.includes(c)) continue;
        up.push(c);
        queue.push(...(incoming.get(c) ?? []));
      }
      const prior = up
        .map((id) => g?.nodes?.find((n) => n.id === id))
        .filter((n): n is WireNode => !!n && ["call", "message", "data"].includes(n.type))
        .reverse()
        .map((n) => {
          const isFetch = n.type === "data" && String((n.config?.http as { url?: string } | undefined)?.url ?? "").includes("store-visits");
          const fields = n.type === "data" ? (isFetch ? ACTION_FIELDS.fetch : ACTION_FIELDS.status) : ["summary", "status", "call_duration", "client_analysis.*"];
          return { node_id: n.id, label: n.name ?? "Call", reference_prefix: `agent.${n.id}`, fields };
        });
      const lastAgent = up.map((id) => g?.nodes?.find((n) => n.id === id)).find((n) => n && (n.type === "call" || n.type === "message") && n.config?.agent_id);
      const vars = ((g?.variables_config as { variables?: { name: string }[] } | undefined)?.variables ?? state.graph?.variables_config as { variables?: { name: string }[] } | undefined)?.variables ?? [];
      return {
        workflow_id: BUILD_ID, node_id: nodeId, agent_id: agentId || null,
        required_variables: (agentInfo[agentId]?.custom_variables ?? []).map((name) => ({ name, required: true, mapped: !!mapping[name], current_value: mapping[name] ?? null })),
        available_sources: { workflow_variables: vars.map((v) => v.name), prior_nodes: prior },
        inject_previous_summary: true, summary_variable_name: "summary", suggested_summary_source_node_id: lastAgent?.id ?? null,
      };
    },
  };
}
