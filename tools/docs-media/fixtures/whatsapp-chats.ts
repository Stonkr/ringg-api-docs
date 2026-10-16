// Logs → WhatsApp fixtures: the chat list, one chat's details (transcript with a template send and a quick-reply
// tap), its analysis and tool logs. Shapes: ChatHistoryItem, GetChatDetailsResponse, GetChatAnalysisResponse
// (types/history.types.ts, lib/api/history.api.ts). The rest of the Logs page comes from monitor.ts (read-only).
// Fictional data only: Acme Lending, +91 98765 4xxxx numbers.
import { agentsWithVersions, logsRoutes } from "./monitor.ts";
import { WA_ACCOUNT_ID, waTemplates, whatsappAccountRoutes } from "./whatsapp.ts";

const AGENT = agentsWithVersions.find((a) => a.id === "agt_whatsapp")!;
const VERSION = AGENT.versions[0];
// The business number's Meta phone number id, as the list and CSV show it.
const BUSINESS_ID = "wa_pn_40321";

const istToIso = (ist: string) => new Date(ist.replace(" ", "T") + "+05:30").toISOString();

type Row = [id: string, name: string, num: string, ist: string, status: "completed" | "ongoing" | "failed", dur: number, classification: string];
const rows: Row[] = [
  ["c91e2f4a-6b3d-4e8a-9c17-2d5f8a0b3e61", "Priya Nair", "+919876545012", "2026-10-06 11:48:20", "completed", 214, "Payment link sent"],
  ["7b3a9d1e-2c4f-4a6b-8e05-9f1d3c7a5b28", "Amit Shah", "+919876545077", "2026-10-06 11:21:09", "completed", 162, "Statement requested"],
  ["e4d81c6b-9a2f-4f3e-b7d0-1c6e8a2f4d93", "Farah Khan", "+919876545134", "2026-10-06 10:55:47", "ongoing", 0, ""],
  ["2f6b0e9d-4c8a-4d1f-a3e7-8b2d5f9c1a04", "Rajesh Kumar", "+919876545190", "2026-10-06 10:12:33", "completed", 98, "Promise to pay"],
  ["9a0c5e3f-1d7b-4b2a-8f6e-3e9a1c7d5b82", "Sunita Rao", "+919876545246", "2026-10-05 17:40:05", "completed", 305, "Callback requested"],
  ["5e8f2a7c-3b1d-4c9e-a6f4-0d7b9e2c8a15", "Deepak Yadav", "+919876545301", "2026-10-05 15:02:58", "failed", 0, ""],
  ["b1d7c4e9-8f2a-4e6b-9d3c-5a0f7e1b4c76", "Neeta Shetty", "+919876545359", "2026-10-05 12:26:14", "completed", 141, "Payment link sent"],
  ["3c5e7a9b-1d3f-4a5c-8e7b-9d1f3a5c7e9b", "Vikram Joshi", "+919876545418", "2026-10-04 16:05:41", "completed", 77, "Information shared"],
];

export const chats = rows.map(([id, name, num, ist, status, dur, classification]) => ({
  kind: "chat", call_type: "whatsapp_chat", id, status, created_at: istToIso(ist), call_attempt_time: istToIso(ist), call_duration: dur || null, name,
  from_number: num, to_number: BUSINESS_ID, from_numbers: [BUSINESS_ID],
  agent: { id: AGENT.id, agent_name: AGENT.agent_display_name, agent_version_id: VERSION.version_id, orchestration_mode: "single_node", version: { version_id: VERSION.version_id, version_slug: VERSION.version_slug } },
  call_cost: null, currency: null, channel: "whatsapp", external_chat_id: `wa_${id.slice(0, 8)}`, ...(classification ? { classification } : {}),
}));

export const FEATURED_CHAT_ID = chats[0].id;
const featured = chats[0];
const start = new Date(featured.created_at).getTime();
const at = (offsetS: number) => new Date(start + offsetS * 1000).toISOString();

// The bot's template send carries the values it went out with; the customer's tap quotes it back.
const sentTemplate = {
  name: "emi_due_reminder", language_code: "en",
  components: [{ type: "body", parameters: [{ type: "text", text: "Priya" }, { type: "text", text: "8,200" }, { type: "text", text: "PL-3390" }, { type: "text", text: "10 October" }] }],
};
const featuredTranscript = [
  { role: "user", text: "Hi, I want to pay my EMI for this month", message_id: "wam_1", external_message_id: "wamid.in.001", timestamp: at(0) },
  { role: "bot", text: "", template: sentTemplate, message_id: "wam_2", external_message_id: "wamid.out.002", timestamp: at(6) },
  { role: "user", text: "Pay now", message_id: "wam_3", external_message_id: "wamid.in.003", reply_to_message_id: "wamid.out.002", is_button_tap: true, timestamp: at(34) },
  { role: "bot", text: "Here is your UPI link: https://pay.acme-lending.example/pl/8Hq2\nIt is valid for 24 hours.", message_id: "wam_4", external_message_id: "wamid.out.004", timestamp: at(39) },
  { role: "user", text: "Paid ✅", message_id: "wam_5", external_message_id: "wamid.in.005", timestamp: at(182) },
  { role: "bot", text: "Thank you, Priya. We have received ₹8,200 for loan PL-3390. Your receipt will reach your email shortly.", message_id: "wam_6", external_message_id: "wamid.out.006", timestamp: at(190) },
  { role: "user", text: "Great, thanks!", message_id: "wam_7", external_message_id: "wamid.in.007", timestamp: at(205) },
  { role: "bot", text: "You're welcome. Have a nice day!", message_id: "wam_8", external_message_id: "wamid.out.008", timestamp: at(210) },
];

const customArgs = (c: (typeof chats)[number]) => ({ customer_name: c.name, loan_account: "PL-3390", emi_amount: 8200, due_date: "2026-10-10" });

const chatDetails = (id: string) => {
  const c = chats.find((x) => x.id === id) ?? featured;
  const s = new Date(c.created_at).getTime();
  const transcript = c.id === featured.id ? featuredTranscript : [
    { role: "user", text: "Hi, I need my loan statement for September", message_id: "wam_1", timestamp: new Date(s).toISOString() },
    { role: "bot", text: `Hi ${c.name?.split(" ")[0]}! I have emailed the September statement for loan PL-3390 to your registered email.`, message_id: "wam_2", timestamp: new Date(s + 5000).toISOString() },
  ];
  return {
    status: "success",
    data: {
      id: c.id, external_chat_id: c.external_chat_id, workspace_id: "ws_demo", channel: "whatsapp", status: c.status, from_number: c.from_number, to_number: BUSINESS_ID, telephony_account_id: WA_ACCOUNT_ID,
      agent_id: AGENT.id, agent_name: AGENT.agent_display_name, version_id: VERSION.version_id, version_slug: VERSION.version_slug, version_description: "",
      initiation_time: c.created_at, chat_duration: c.call_duration ?? 0, custom_args_values: customArgs(c), classification: c.classification ?? "", transcript,
    },
  };
};

const chatAnalysis = (id: string) => {
  const c = chats.find((x) => x.id === id) ?? featured;
  const done = c.status === "completed";
  const isFeatured = c.id === featured.id;
  return {
    chat_details: { duration: String(c.call_duration ?? 0), start_time: c.created_at, end_time: new Date(new Date(c.created_at).getTime() + (c.call_duration ?? 0) * 1000).toISOString(), channel: "whatsapp", participants: { user: c.name, assistant: AGENT.agent_display_name }, custom_args_values: customArgs(c) },
    general_analysis_status: done,
    general_analysis: done
      ? {
          summary: isFeatured ? "Priya asked to pay her October EMI of ₹8,200 for loan PL-3390. The agent sent the EMI reminder template, she tapped Pay now, received a UPI link and confirmed the payment." : `${c.name} chatted with the WhatsApp concierge about loan PL-3390.`,
          key_points: isFeatured ? ["Wants to pay the October EMI", "Tapped Pay now on the reminder template", "Paid ₹8,200 through the UPI link"] : [],
          classification: c.classification ?? "", action_items: isFeatured ? ["Email the payment receipt", "Mark the October EMI as paid in the CRM"] : [],
          call_disconnect_reason: "Agent ended the chat after the customer said goodbye", callback_requested_time: "", timezone: "Asia/Kolkata",
        }
      : {},
    client_analysis_status: done,
    client_analysis: done && isFeatured ? { payment_completed: true, amount_paid: 8200, payment_mode: "UPI", callback_requested: false } : done ? { payment_completed: false, callback_requested: c.classification === "Callback requested" } : {},
  };
};

const toolLog = (n: number, phase: string, type: string, name: string, offsetS: number, x: Record<string, unknown> = {}) => ({
  id: `tl_wa_0${n}`, call_id: FEATURED_CHAT_ID, message_id: null, workspace_id: "ws_demo", node_id: null, source_node_label: null, target_node_label: null,
  tool_name: name, tool_phase: phase, tool_type: type, request_params: null, response_data: null, jq: null, status_code: null, execution_status: "success", latency_ms: null,
  error_details: null, function_metadata: {}, executed_at: at(offsetS), created_at: at(offsetS), updated_at: at(offsetS), ...x,
});
const featuredToolLogs = [
  toolLog(1, "pre_call", "api_tool", "fetch_loan_details", -1, {
    request_params: { method: "GET", url: "https://api.acme-lending.example/v1/loans/PL-3390", query_params: { fields: "emi_amount,due_date" } },
    response_data: { loan_account: "PL-3390", emi_amount: 8200, due_date: "2026-10-10", overdue_days: 0 },
    status_code: 200, latency_ms: 172,
  }),
  toolLog(2, "on_call", "send_template_tool", "send_emi_due_reminder", 5, {
    message_id: "wam_2",
    request_params: { template: "emi_due_reminder", language: "en", to: "+919876545012", body: ["Priya", "8,200", "PL-3390", "10 October"] },
    response_data: { message_id: "wamid.out.002", status: "accepted" },
    status_code: 200, latency_ms: 388,
  }),
  toolLog(3, "on_call", "end_chat", "end_chat", 212, { request_params: { reason: "Customer said goodbye" } }),
  toolLog(4, "post_call", "api_call", "update_crm", 222, {
    request_params: { method: "POST", url: "https://crm.acme-lending.example/hooks/ringg", body: { loan_account: "PL-3390", classification: "Payment link sent", payment_completed: true } },
    response_data: { ok: true, ticket_id: "CRM-58240" },
    status_code: 201, latency_ms: 240,
  }),
];

/** GET /chat/history/v2: honours the filters the scenario uses (status, agent, numbers, chat id); download=true answers the CSV export. */
function chatHistoryHandler(url: URL) {
  const p = url.searchParams;
  if (p.get("download")) return { message: "Chat history report (with the applied filters) is being sent to your email." };
  let list = chats;
  const statuses = p.getAll("status").flatMap((s) => s.split(","));
  if (statuses.length) list = list.filter((c) => statuses.includes(c.status));
  const agentIds = p.getAll("agent_id").flatMap((s) => s.split(","));
  if (agentIds.length) list = list.filter((c) => agentIds.includes(c.agent.id));
  const from = p.get("from_number");
  if (from) list = list.filter((c) => c.from_number.includes(from.replace(/\s/g, "")));
  const to = p.get("to_number");
  if (to) list = list.filter((c) => c.to_number.includes(to));
  const id = p.get("chat_id");
  if (id) list = list.filter((c) => c.id === id);
  return { limit: 100, count: list.length, total: list.length === chats.length ? 486 : list.length, offset: 0, calls: list };
}

export const whatsappChatRoutes = {
  ...logsRoutes,
  ...whatsappAccountRoutes,
  "GET /chat/history/v2": (url: URL) => chatHistoryHandler(url),
  "GET /chat/details": (url: URL) => chatDetails(url.searchParams.get("chat_id") ?? ""),
  "GET /chat/analysis/*": (url: URL) => chatAnalysis(decodeURIComponent(url.pathname.split("/").at(-1)!)),
  "GET /tools/call-logs/*": (url: URL) => (url.pathname.endsWith(FEATURED_CHAT_ID) ? featuredToolLogs : (logsRoutes["GET /tools/call-logs/*"] as (u: URL) => unknown)(url)),
  "GET /whatsapp/embedded-signup/*/templates": { templates: waTemplates },
};
