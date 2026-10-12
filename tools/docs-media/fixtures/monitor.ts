// Monitor area fixtures: call history (Logs), one call's full details, agents with versions, campaigns.
// Fictional data only: Acme Lending, Indian names, INR, +91 98765 4xxxx numbers.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { agents, agentRoutes } from "./agents.ts";

const AGENT_NAMES: Record<string, string> = Object.fromEntries(agents.map((a) => [a.id, a.agent_display_name]));
const MODES: Record<string, string> = Object.fromEntries(agents.map((a) => [a.id, a.orchestration_mode]));

/** Agents list with versions (Logs and Analytics filters list each agent's versions). */
export const agentsWithVersions = agents.map((a) => ({
  ...a,
  versions:
    a.id === "agt_payment_reminder"
      ? [
          { version_id: "ver_pr_v1", version_slug: "v1", is_archived: false },
          { version_id: "ver_pr_v2", version_slug: "v2", is_archived: false },
        ]
      : [{ version_id: `ver_${a.id.slice(4)}_v1`, version_slug: "v1", is_archived: false }],
}));
const versionOf = (agentId: string, slug = "v1") => agentsWithVersions.find((a) => a.id === agentId)!.versions.find((v) => v.version_slug === slug)!;

export const campaigns = [
  { id: "cmp_oct_emi_due", name: "October EMI reminders", campaign_status: "running", agent_id: "agt_payment_reminder", agent_display_name: "Payment reminder", created_at: "2026-10-01T03:30:00Z", total_calls: 1840, total_contacts: 1200 },
  { id: "cmp_sep_overdue", name: "September overdue follow-up", campaign_status: "completed", agent_id: "agt_payment_reminder", agent_display_name: "Payment reminder", created_at: "2026-09-18T04:00:00Z", total_calls: 960, total_contacts: 640 },
  { id: "cmp_website_leads", name: "Website leads – week 40", campaign_status: "completed", agent_id: "agt_lead_callback", agent_display_name: "Lead qualification", created_at: "2026-09-29T05:00:00Z", total_calls: 210, total_contacts: 180 },
];

export const FEATURED_CALL_ID = "3f6c2a1e-8b4d-4c7a-9e21-5d0b7a9c4e18";

type Row = [id: string, agent: string, name: string, num: string, ist: string, status: string, dur: number, type?: string, extra?: Record<string, unknown>];
// Times are IST wall clock on the given day.
const rows: Row[] = [
  [FEATURED_CALL_ID, "agt_payment_reminder", "Rahul Verma", "+919876541023", "2026-10-06 11:42:10", "completed", 64, "outbound", { campaign: true, version: "v2" }],
  ["8a1d4f2c-3b6e-4d90-a1c7-2e5f8b3d6a41", "agt_payment_reminder", "Sneha Iyer", "+919876541187", "2026-10-06 11:38:52", "completed", 91, "outbound", { campaign: true, version: "v2" }],
  ["c47e9b10-6d2a-4f3e-8b5c-1a9d7e2f4c63", "agt_support_line", "Arjun Mehta", "+919876542245", "2026-10-06 11:31:05", "completed", 148, "inbound"],
  ["e2b85d37-9c1f-4a6d-b3e8-7f0a2c5d9b14", "agt_payment_reminder", "Kavya Nair", "+919876541356", "2026-10-06 11:27:44", "failed", 0, "outbound", { campaign: true, version: "v1" }],
  ["5d93a6e8-2f4b-4c1d-9a7e-3b8c0f6d2e57", "agt_payment_reminder", "Vikram Singh", "+919876541412", "2026-10-06 11:20:18", "retry", 0, "outbound", { campaign: true, version: "v2", next: "2026-10-06 13:20:00", attempts: true }],
  ["a6f1c3d9-4e8b-4b2a-8d5f-9c7e1a3b6d20", "agt_website", "Website visitor", "", "2026-10-06 11:12:33", "completed", 212, "webcall"],
  ["1b7e5a2d-8c3f-4e6b-a9d1-4f2c8e7b3a95", "agt_payment_reminder", "Ananya Reddy", "+919876541598", "2026-10-06 11:05:47", "completed", 57, "outbound", { campaign: true, version: "v1", voicemail: true }],
  ["d8c2f6a4-1e9b-4d7c-b5a3-6e0f9d2c8b71", "agt_lead_callback", "Rohan Gupta", "+919876543301", "2026-10-06 10:58:02", "completed", 176, "outbound", { campaign: true }],
  ["f3a9e1c5-7b2d-4a8e-9c6f-0d4b8a2e7c36", "agt_payment_reminder", "Meera Pillai", "+919876541634", "2026-10-06 10:51:26", "ongoing", 0, "outbound", { campaign: true, version: "v2" }],
  ["4c8b2e7f-5a1d-4f9c-8e3b-2d6a0c9f5e82", "agt_support_line", "Siddharth Rao", "+919876542318", "2026-10-06 10:44:11", "completed", 203, "inbound"],
  ["9e5d1a3c-6f8b-4c2e-a7d4-8b1f3e6c0a29", "agt_payment_reminder", "Pooja Desai", "+919876541772", "2026-10-06 10:37:59", "cancelled", 0, "outbound", { campaign: true, version: "v1" }],
  ["2a6f8c4e-9d3b-4e1a-b8c5-7e2d0a4f9b63", "agt_payment_reminder", "Aditya Kulkarni", "+919876541845", "2026-10-06 10:30:40", "completed", 72, "outbound", { campaign: true, version: "v2" }],
  ["7d1b9f5a-3e6c-4a2d-9f8e-1c5b7d3a0e48", "agt_loan_flow", "Nisha Bansal", "+919876544120", "2026-10-06 10:22:15", "completed", 245, "outbound"],
  ["b0e4c8a2-7f5d-4b3e-8a1c-6d9f2b5e3c07", "agt_payment_reminder", "Karan Malhotra", "+919876541903", "2026-10-05 18:14:28", "completed", 83, "outbound", { campaign: true, version: "v1" }],
  ["6f2d0b8e-4a7c-4e5f-b1d9-3a8e6c2f0b94", "agt_payment_reminder", "Divya Menon", "+919876541967", "2026-10-05 17:52:03", "error", 0, "outbound", { campaign: true, version: "v2" }],
  ["c3a7e5b1-2d9f-4c8a-9e6b-5f1d3a7c9e26", "agt_support_line", "Manish Tiwari", "+919876542487", "2026-10-05 16:40:37", "completed", 121, "inbound"],
  ["e8b4a0d6-9c2e-4f1b-a5d7-0e3c8b6a2f51", "agt_payment_reminder", "Ishita Chopra", "+919876540034", "2026-10-05 15:21:50", "registered", 0, "outbound", { campaign: true, version: "v2", next: "2026-10-06 14:00:00" }],
  ["0d9f3b7e-1a5c-4d2f-8b6e-9c4a1e7d3b80", "agt_lead_callback", "Tanvi Joshi", "+919876543376", "2026-10-05 14:09:12", "failed", 0, "outbound", { campaign: true }],
  ["5b1e7c3a-8f4d-4a9b-b2e6-4d0c9f5a1e37", "agt_payment_reminder", "Harsh Agarwal", "+919876540112", "2026-10-05 12:47:29", "completed", 69, "outbound", { api: true, version: "v1" }],
  ["a9c5f1e7-3b8d-4e4c-9a0f-2e6b8d4c7a13", "agt_website", "Website visitor", "", "2026-10-05 11:33:44", "completed", 134, "webcall"],
  ["3e7a1c9f-6d2b-4b8e-a4c0-8f5d1b9e6c72", "agt_payment_reminder", "Lakshmi Krishnan", "+919876540258", "2026-10-04 17:26:08", "completed", 98, "outbound", { campaign: true, version: "v1" }],
  ["d4b0e8c2-5f9a-4c3d-8e7b-1a6f4c0d8e95", "agt_support_line", "Gaurav Saxena", "+919876542519", "2026-10-04 15:15:31", "completed", 187, "inbound"],
  ["8f6c2a0e-7b3d-4f5a-b9c1-5e8a2d6f0c43", "agt_payment_reminder", "Riya Kapoor", "+919876540391", "2026-10-04 12:02:55", "completed", 61, "outbound", { campaign: true, version: "v1", callback: true }],
  ["1c5a9e3b-4d7f-4a1c-8f2e-9b3d7a1c5e68", "agt_lead_callback", "Abhishek Jain", "+919876543442", "2026-10-03 16:48:19", "completed", 154, "outbound", { campaign: true }],
  ["b7d3f9a5-0e2c-4b6d-9c8a-3f1e5b7d9a24", "agt_payment_reminder", "Neha Bhatt", "+919876540476", "2026-10-03 11:30:06", "completed", 77, "outbound", { campaign: true, version: "v1" }],
  ["4a0e6c2f-8b5d-4e9a-a3f7-6c2a0e4b8d19", "agt_loan_flow", "Sanjay Patil", "+919876544187", "2026-10-02 14:55:42", "failed", 0, "outbound"],
];

const istToIso = (ist: string) => new Date(ist.replace(" ", "T") + "+05:30").toISOString();
// Per-minute style pricing: ₹6.5 per connected minute, rounded to paise.
const costOf = (dur: number) => Math.round((dur / 60) * 650) / 100;

export const calls = rows.map(([id, agentId, name, num, ist, status, dur, type = "outbound", x = {}]) => {
  const v = versionOf(agentId, (x.version as string) ?? "v1");
  return {
    id,
    name,
    to_number: type === "inbound" ? "+918045671200" : num,
    inbound_from: type === "inbound" ? num : null,
    call_cost: status === "completed" ? costOf(dur) : status === "failed" || status === "error" ? 0 : null,
    currency: "INR",
    created_at: istToIso(ist),
    call_attempt_time: istToIso(ist),
    transcript: "",
    audio_recording: null,
    call_duration: dur,
    call_type: type,
    credits_processed: status === "completed",
    agent: { id: agentId, agent_name: AGENT_NAMES[agentId], orchestration_mode: MODES[agentId], version: { version_id: v.version_id, version_slug: v.version_slug } },
    from_numbers: type === "webcall" ? [] : type === "inbound" ? ["+918045671200"] : ["+918045671234"],
    voicemail_detected: !!x.voicemail,
    bulk_list_id: x.campaign ? (agentId === "agt_lead_callback" ? "cmp_website_leads" : "cmp_oct_emi_due") : "",
    status,
    next_attempt_time: x.next ? istToIso(x.next as string) : null,
    frequency_deferred_at: null,
    cancelled_by_callee_limit: false,
    is_callback: !!x.callback,
    has_call_attempts: !!x.attempts,
  };
});

/** GET /calling/history/v2: honours the filters the scenarios use (status, agent, call type, call id). */
export function historyHandler(url: URL) {
  const p = url.searchParams;
  let list = calls as typeof calls;
  const statuses = p.getAll("status").flatMap((s) => s.split(","));
  if (statuses.length) list = list.filter((c) => statuses.includes(c.status));
  const agentIds = p.getAll("agent_id").flatMap((s) => s.split(","));
  if (agentIds.length) list = list.filter((c) => agentIds.includes(c.agent.id));
  const callType = p.get("call_type");
  if (callType === "voicemail") list = list.filter((c) => c.voicemail_detected);
  else if (callType === "callback") list = list.filter((c) => c.is_callback);
  else if (callType) list = list.filter((c) => c.call_type === callType);
  const callId = p.get("call_id");
  if (callId) list = list.filter((c) => c.id === callId);
  // Present the sample as one page of a larger month.
  const total = list.length === calls.length ? 2340 : list.length;
  return { limit: 100, count: list.length, total, offset: 0, calls: list };
}

// --- The featured call: a short payment-reminder conversation (English). ---
const turns: [who: "bot" | "user", text: string, offsetMs: number][] = [
  ["bot", "Hello, am I speaking with Rahul Verma?", 600],
  ["user", "Yes, speaking. Who is this?", 3900],
  ["bot", "Hi Rahul, this is Asha calling from Acme Lending about your personal loan ending 4821. Your EMI of ₹12,450 is due on 10 October. Is this a good time to talk for a minute?", 6400],
  ["user", "Yes, go ahead.", 17800],
  ["bot", "Thank you. I wanted to check whether you will be able to pay the EMI by the due date.", 19900],
  ["user", "My salary comes on the 8th, so I can pay on the 9th.", 26100],
  ["bot", "That works. Would you like me to send a UPI payment link to this number on the 9th morning?", 31200],
  ["user", "Yes, please send it on WhatsApp.", 38300],
  ["bot", "Done. I have scheduled the payment link for 9 October on WhatsApp. Paying by the 10th keeps your account free of late fees.", 41500],
  ["user", "Okay, thank you.", 51700],
  ["bot", "You're welcome, Rahul. Have a good day.", 53900],
];
const callStart = new Date(istToIso("2026-10-06 11:42:10")).getTime();
export const featuredTranscript = turns.map(([who, text, off], i) => ({
  [who]: text,
  message_id: `msg_${String(i + 1).padStart(2, "0")}`,
  timestamp: new Date(callStart + off).toISOString(),
  audio_offset_ms: off,
}));

/** Placeholder recording: a speech-like synthetic tone envelope (no real voice). Built once with ffmpeg, served as a data URI. */
function placeholderRecording(): string {
  const file = resolve(import.meta.dirname, "../out/monitor-recording.mp3");
  if (!existsSync(file)) {
    mkdirSync(resolve(import.meta.dirname, "../out"), { recursive: true });
    const expr = "0.5*(random(0)*2-1)*gt(sin(2*PI*0.21*t)+0.6*sin(2*PI*0.93*t+1)+0.3*sin(2*PI*2.9*t),0.15)*(0.4+0.6*abs(sin(2*PI*1.3*t)))";
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `aevalsrc='${expr}':s=16000:d=64`, "-ac", "1", "-b:a", "24k", file]);
  }
  return "data:audio/mpeg;base64," + readFileSync(file).toString("base64");
}

export const featuredAnalysis = {
  call_details: {
    duration: "64",
    start_time: istToIso("2026-10-06 11:42:10"),
    end_time: istToIso("2026-10-06 11:43:14"),
    agent_type: "outbound",
    first_tts_time: 0.62,
    custom_args_values: { callee_name: "Rahul Verma", loan_account: "PL-4821", emi_amount: 12450, due_date: "2026-10-10" },
    overall_latency: 0.842,
    participants: { user: "Rahul Verma", assistant: "Payment reminder" },
  },
  general_analysis_status: true,
  general_analysis: {
    summary: "Rahul confirmed his EMI of ₹12,450 is due on 10 October and committed to pay on 9 October after his salary is credited. He asked for a UPI payment link on WhatsApp, which the agent scheduled for 9 October.",
    key_points: ["Customer identity confirmed", "EMI of ₹12,450 due on 10 October", "Customer will pay on 9 October", "UPI link requested on WhatsApp"],
    classification: "Promise to pay",
    action_items: ["Send UPI payment link on WhatsApp on 9 October", "Check payment status on 10 October"],
    call_disconnect_reason: "Agent ended the call after the customer said goodbye",
    callback_requested_time: "",
    sentiment: "Positive",
    sentiment_reason: "Customer was cooperative and agreed to a payment date.",
    timezone: "Asia/Kolkata",
  },
  client_analysis_status: true,
  client_analysis: {
    payment_promised: true,
    promised_payment_date: "2026-10-09",
    payment_mode: "UPI",
    reason_for_delay: "Salary credited on the 8th",
    needs_human_follow_up: false,
  },
  call_feedback: null,
};

export const featuredEvals = {
  count: 4,
  results: [
    { id: "evr_01", call_id: FEATURED_CALL_ID, metric_id: "met_hallucination", metric_name: "hallucination", score: 1, explanation: "Every figure the agent stated (EMI amount, due date, loan ending) matches the call variables.", violations: [], created_at: "2026-10-06T06:14:00Z" },
    { id: "evr_02", call_id: FEATURED_CALL_ID, metric_id: "met_instruction_following", metric_name: "instruction_following", score: 0.75, explanation: "Verified identity and confirmed a payment date, but skipped the language check the prompt asks for.", violations: [{ severity: "low", turn_index: 2, agent_response_snippet: "Hi Rahul, this is Asha calling from Acme Lending…", explanation: "Did not ask whether the customer prefers English or Hindi before continuing, as the prompt requires." }], created_at: "2026-10-06T06:14:00Z" },
    { id: "evr_03", call_id: FEATURED_CALL_ID, metric_id: "met_knowledge_gap", metric_name: "knowledge_gap", score: 1, explanation: "The customer asked nothing the agent could not answer.", violations: [], created_at: "2026-10-06T06:14:00Z" },
    { id: "evr_04", call_id: FEATURED_CALL_ID, metric_id: "met_tool_accuracy", metric_name: "tool_accuracy", score: 1, explanation: "Scheduled the WhatsApp payment link with the promised date.", violations: [], created_at: "2026-10-06T06:14:00Z" },
  ],
};

/** Tool calls of the featured call: a pre-call lookup, the on-call payment-link tool, end call, and a post-call CRM webhook. */
const toolLog = (n: number, phase: string, type: string, name: string, atMs: number, x: Record<string, unknown> = {}) => ({
  id: `tl_0${n}`, call_id: FEATURED_CALL_ID, message_id: null, workspace_id: "ws_demo", node_id: null, source_node_label: null, target_node_label: null,
  tool_name: name, tool_phase: phase, tool_type: type, request_params: null, response_data: null, jq: null, status_code: null, execution_status: "success", latency_ms: null,
  error_details: null, function_metadata: {}, executed_at: new Date(callStart + atMs).toISOString(), created_at: new Date(callStart + atMs).toISOString(), updated_at: new Date(callStart + atMs).toISOString(),
  ...x,
});
export const featuredToolLogs = [
  toolLog(1, "pre_call", "api_tool", "fetch_loan_details", -2400, {
    request_params: { method: "GET", url: "https://api.acme-lending.example/v1/loans/PL-4821", query_params: { fields: "emi_amount,due_date,overdue_days" } },
    response_data: { loan_account: "PL-4821", emi_amount: 12450, due_date: "2026-10-10", overdue_days: 0, preferred_language: "en" },
    status_code: 200, latency_ms: 186,
  }),
  toolLog(2, "on_call", "api_tool", "schedule_payment_link", 40800, {
    message_id: "msg_09",
    request_params: { phone: "+919876541023", channel: "whatsapp", send_on: "2026-10-09", amount: 12450 },
    response_data: { scheduled: true, link_id: "pl_7Q2K9", send_at: "2026-10-09T09:00:00+05:30" },
    status_code: 200, latency_ms: 412,
  }),
  toolLog(3, "on_call", "end_call", "end_call", 56200, { request_params: { reason: "Customer said goodbye" } }),
  toolLog(4, "post_call", "api_call", "update_crm", 66000, {
    request_params: { method: "POST", url: "https://crm.acme-lending.example/hooks/ringg", body: { loan_account: "PL-4821", classification: "Promise to pay", promised_date: "2026-10-09" } },
    response_data: { ok: true, ticket_id: "CRM-58213" },
    status_code: 201, latency_ms: 238,
  }),
];

const genericAnalysis = (id: string) => {
  const c = calls.find((x) => x.id === id);
  const done = c?.status === "completed";
  return {
    call_details: { duration: String(c?.call_duration ?? 0), start_time: c?.created_at ?? "", end_time: c?.created_at ?? "", agent_type: c?.call_type ?? "outbound", first_tts_time: 0.7, custom_args_values: { callee_name: c?.name ?? "" }, overall_latency: done ? 0.91 : 0, participants: { user: c?.name ?? "", assistant: c?.agent.agent_name ?? "" } },
    general_analysis_status: done,
    general_analysis: done ? { summary: `${c?.name} spoke with the ${c?.agent.agent_name} agent.`, key_points: [], classification: "Information shared", action_items: [], call_disconnect_reason: "Customer ended the call", callback_requested_time: "", timezone: "Asia/Kolkata" } : {},
    client_analysis_status: done,
    client_analysis: {},
    call_feedback: null,
  };
};

// --- WhatsApp chats (Logs → WhatsApp). Shapes: ChatHistoryItem, GetChatDetailsResponse, GetChatAnalysisResponse. ---
const WA_BUSINESS = "+918045671250";
type ChatRow = [id: string, name: string, num: string, ist: string, status: "completed" | "ongoing" | "failed", dur: number, classification: string];
const chatRows: ChatRow[] = [
  ["c91e2f4a-6b3d-4e8a-9c17-2d5f8a0b3e61", "Priya Nair", "+919876545012", "2026-10-06 11:48:20", "completed", 214, "Payment link sent"],
  ["7b3a9d1e-2c4f-4a6b-8e05-9f1d3c7a5b28", "Amit Shah", "+919876545077", "2026-10-06 11:21:09", "completed", 162, "Statement requested"],
  ["e4d81c6b-9a2f-4f3e-b7d0-1c6e8a2f4d93", "Farah Khan", "+919876545134", "2026-10-06 10:55:47", "ongoing", 0, ""],
  ["2f6b0e9d-4c8a-4d1f-a3e7-8b2d5f9c1a04", "Rajesh Kumar", "+919876545190", "2026-10-06 10:12:33", "completed", 98, "Promise to pay"],
  ["9a0c5e3f-1d7b-4b2a-8f6e-3e9a1c7d5b82", "Sunita Rao", "+919876545246", "2026-10-05 17:40:05", "completed", 305, "Callback requested"],
  ["5e8f2a7c-3b1d-4c9e-a6f4-0d7b9e2c8a15", "Deepak Yadav", "+919876545301", "2026-10-05 15:02:58", "failed", 0, ""],
  ["b1d7c4e9-8f2a-4e6b-9d3c-5a0f7e1b4c76", "Neeta Shetty", "+919876545359", "2026-10-05 12:26:14", "completed", 141, "Payment link sent"],
];
const waVersion = versionOf("agt_whatsapp");
export const chats = chatRows.map(([id, name, num, ist, status, dur, classification]) => ({
  kind: "chat",
  call_type: "whatsapp_chat",
  id,
  status,
  created_at: istToIso(ist),
  call_attempt_time: istToIso(ist),
  call_duration: dur || null,
  name,
  from_number: num,
  to_number: WA_BUSINESS,
  from_numbers: [WA_BUSINESS],
  agent: { id: "agt_whatsapp", agent_name: AGENT_NAMES.agt_whatsapp, agent_version_id: waVersion.version_id, orchestration_mode: "single_node", version: { version_id: waVersion.version_id, version_slug: waVersion.version_slug } },
  call_cost: null,
  currency: null,
  channel: "whatsapp",
  external_chat_id: `wa_${id.slice(0, 8)}`,
  ...(classification ? { classification } : {}),
}));
const FEATURED_CHAT = chats[0];
const chatTurns: [role: "bot" | "user", text: string, offsetS: number][] = [
  ["user", "Hi, I want to pay my EMI for this month", 0],
  ["bot", "Hi Priya! Your EMI of ₹8,200 for loan PL-3390 is due on 10 October. Would you like a UPI payment link?", 4],
  ["user", "Yes please", 31],
  ["bot", "Here is your payment link: https://pay.acme-lending.example/pl/8Hq2. It is valid for 24 hours.", 35],
  ["user", "Paid ✅", 182],
  ["bot", "Thank you, Priya. We have received ₹8,200. Your receipt will reach your email shortly.", 190],
  ["user", "Great, thanks!", 205],
  ["bot", "You're welcome. Have a nice day!", 210],
];
const chatDetails = (id: string) => {
  const c = chats.find((x) => x.id === id) ?? FEATURED_CHAT;
  const start = new Date(c.created_at).getTime();
  const turns = c.id === FEATURED_CHAT.id ? chatTurns : ([["user", "Hi, I need my loan statement", 0], ["bot", `Hi ${c.name?.split(" ")[0]}! I have emailed your statement for September.`, 5]] as typeof chatTurns);
  return {
    status: "success",
    data: {
      id: c.id, external_chat_id: c.external_chat_id, workspace_id: "ws_demo", channel: "whatsapp", status: c.status, from_number: c.from_number, to_number: WA_BUSINESS,
      telephony_account_id: null, agent_id: "agt_whatsapp", agent_name: AGENT_NAMES.agt_whatsapp, version_id: waVersion.version_id, version_slug: waVersion.version_slug, version_description: "",
      initiation_time: c.created_at, chat_duration: c.call_duration ?? 0, custom_args_values: { customer_name: c.name, loan_account: "PL-3390" }, classification: c.classification ?? "",
      transcript: turns.map(([role, text, off], i) => ({ role, text, message_id: `wam_${i + 1}`, timestamp: new Date(start + off * 1000).toISOString() })),
    },
  };
};
const chatAnalysis = (id: string) => {
  const c = chats.find((x) => x.id === id) ?? FEATURED_CHAT;
  const done = c.status === "completed";
  return {
    chat_details: { duration: String(c.call_duration ?? 0), start_time: c.created_at, end_time: new Date(new Date(c.created_at).getTime() + (c.call_duration ?? 0) * 1000).toISOString(), channel: "whatsapp", participants: { user: c.name, assistant: AGENT_NAMES.agt_whatsapp }, custom_args_values: { customer_name: c.name, loan_account: "PL-3390" } },
    general_analysis_status: done,
    general_analysis: done ? { summary: c.id === FEATURED_CHAT.id ? "Priya asked to pay her October EMI of ₹8,200. The agent sent a UPI link and confirmed the payment." : `${c.name} chatted with the WhatsApp concierge.`, key_points: [], classification: c.classification ?? "", action_items: [], call_disconnect_reason: "", callback_requested_time: "", timezone: "Asia/Kolkata" } : {},
    client_analysis_status: done,
    client_analysis: done && c.id === FEATURED_CHAT.id ? { payment_completed: true, amount_paid: 8200, payment_mode: "UPI" } : {},
  };
};

export const logsRoutes = {
  ...agentRoutes,
  "GET /agent/all": { status: "success", data: { agents: agentsWithVersions } },
  "GET /campaign/all": { campaigns, pagination: { total: campaigns.length, limit: 1000, offset: 0 } },
  "GET /calling/history/v2": (url: URL) => historyHandler(url),
  "GET /calling/history/filters": {},
  "GET /calling/history": { message: "Call history report (with the applied filters) is being sent to your email." },
  "GET /calling/history/v2/filters": {
    agent_id: "agt_payment_reminder",
    version_id: null,
    custom_variables: [
      { key: "callee_name", type: "string" },
      { key: "emi_amount", type: "number" },
      { key: "due_date", type: "string" },
    ],
    client_analysis_keys: [
      { key: "payment_promised", type: "boolean" },
      { key: "payment_mode", type: "string" },
    ],
  },
  "GET /calling/history/v2/*/attempts": (url: URL) => {
    const id = url.pathname.split("/").at(-2)!;
    const c = calls.find((x) => x.id === id);
    if (!c) return { call_id: id, chain_root: id, call_attempts: [] };
    const attempt = (n: number, status: string, at: string) => ({ id: n === 1 ? id : `${id.slice(0, -2)}0${n}`, attempt_number: n, type: "parent", call_category: "outbound", mobile_number: c.to_number, name: c.name, status, sub_status: status === "failed" ? "NO_ANSWER" : null, called_on_time: at, retry_count: n - 1, call_duration: 0, call_cost: 0, currency: "INR" });
    return { call_id: id, chain_root: id, call_attempts: [attempt(2, "retry", istToIso("2026-10-06 11:20:18")), attempt(1, "failed", istToIso("2026-10-06 09:20:04"))] };
  },
  "GET /calling/analysis/*": (url: URL) => {
    const id = url.pathname.split("/").at(-1)!;
    return id === FEATURED_CALL_ID ? featuredAnalysis : genericAnalysis(id);
  },
  "GET /calling/call-details": (url: URL) => {
    const id = url.searchParams.get("id");
    if (id === FEATURED_CALL_ID) return { status: "success", data: { recording_url: placeholderRecording(), transcription_url: JSON.stringify(featuredTranscript) } };
    const c = calls.find((x) => x.id === id);
    const done = c?.status === "completed";
    return { status: "success", data: { recording_url: done ? placeholderRecording() : null, transcription_url: done ? JSON.stringify([{ bot: `Hello, am I speaking with ${c?.name}?`, message_id: "m1" }, { user: "Yes, speaking.", message_id: "m2" }]) : null } };
  },
  "GET /tools/call-logs/*": (url: URL) => {
    const id = url.pathname.split("/").at(-1)!;
    return id === FEATURED_CALL_ID ? featuredToolLogs : [];
  },
  "GET /evals/observability/calls/*/results": (url: URL) => (url.pathname.includes(FEATURED_CALL_ID) ? featuredEvals : { results: [], count: 0 }),
  "POST /calling/*/call-feedback": { message: "Feedback saved" },
  "GET /chat/history/v2": (url: URL) => {
    if (url.searchParams.get("download")) return { message: "Chat history report (with the applied filters) is being sent to your email." };
    const id = url.searchParams.get("chat_id");
    const list = id ? chats.filter((c) => c.id === id) : chats;
    return { limit: 100, count: list.length, total: id ? list.length : 486, offset: 0, calls: list };
  },
  "GET /chat/details": (url: URL) => chatDetails(url.searchParams.get("chat_id") ?? ""),
  "GET /chat/analysis/*": (url: URL) => chatAnalysis(decodeURIComponent(url.pathname.split("/").at(-1)!)),
};
