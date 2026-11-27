// WhatsApp calling fixtures: the WhatsApp concierge with calling on (Chat and Call configs), the numbers' Meta call
// settings, WhatsApp calls in Logs → WhatsApp next to the chats, and the Calls section of Analytics → WhatsApp.
// Shapes: WAAgentCallingResponse / WACallingSettingsResponse (types/whatsapp.types.ts), CallingHistoryItem with
// calling_source "whatsapp" (types/history.types.ts), GetVolumeGraphResponse / GetChatAnalyticsResponse
// (types/analytics.types.ts), the whatsapp/insights responses (types/whatsapp-insights.types.ts).
// Fictional data only: Acme Lending, +91 98765 4xxxx numbers.
import { agentsWithVersions, placeholderRecording } from "./monitor.ts";
import { analyticsRoutes } from "./monitor-analytics.ts";
import { chats, whatsappChatRoutes } from "./whatsapp-chats.ts";
import { NUM_40321, WA_ID, makeWhatsappEditorRoutes } from "./whatsapp-agents.ts";
import { WA_ACCOUNT_ID, WA_WABA_ID, waNumbers } from "./whatsapp.ts";

const FEATURES = { workspace_id: "ws_demo", features: { whatsapp_calling: true } };

// Both numbers registered: 40321 takes calls, 40322 is below Meta's 2,000-a-day messaging limit.
const numbers = waNumbers.map((n) => ({ ...n, is_registered: true }));

const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"].map((day_of_week) => ({ day_of_week, open_time: "0900", close_time: "1800" }));
const callingSettings = (phone_number_id: string, on: boolean, messaging_limit: string, eligible: boolean) => ({
  phone_number_id,
  settings: {
    status: on ? "ENABLED" : "DISABLED",
    call_icon_visibility: "DEFAULT",
    restrict_to_user_countries: on ? ["IN"] : [],
    call_hours: on ? { status: "ENABLED", timezone_id: "Asia/Kolkata", weekly_operating_hours: weekdays, holiday_schedule: [] } : { status: "DISABLED", timezone_id: null, weekly_operating_hours: [], holiday_schedule: [] },
    callback_permission_status: "DISABLED",
  },
  restrictions: [],
  messaging_limit,
  eligible,
});
const CALLING: Record<string, ReturnType<typeof callingSettings>> = {
  wa_pn_40321: callingSettings("wa_pn_40321", true, "TIER_10K", true),
  wa_pn_40322: callingSettings("wa_pn_40322", false, "TIER_250", false),
};

const agentCalling = {
  agent_id: WA_ID,
  number: { from_number_id: NUM_40321, number: "+919876540321", phone_number_id: "wa_pn_40321", telephony_account_id: WA_ACCOUNT_ID },
  calling: CALLING.wa_pn_40321,
  has_call_config: true,
};

const sections = (s: [string, string][]) => s.map(([section_title, section_content]) => ({ section_title, section_content }));
const CALL_PROMPT = sections([
  ["Role", "You are Neha, the voice assistant for Acme Lending. Customers call you from WhatsApp about EMI payments, statements and loan questions."],
  ["Style", "Speak in short, friendly sentences, one idea at a time. Say amounts and dates the way people say them aloud, such as \"eight thousand two hundred rupees\" and \"the tenth of October\". Never read out links or formatting."],
  ["Task", "Greet {{customer_name}} by name if available. Answer from the knowledge base. If the customer wants to pay, tell them you will send the payment link to this WhatsApp chat. When they are done, thank them and end the call with @||end_call||."],
]);
const endCallTool = { tool_id: "tl_end_call", tool_type: "END_CALL_TOOL", tool_name: "end_call", tool_phase: "on_call", description: "End the call once the customer's request is handled.", display_description: "Hang up after a closing line", is_enabled: true, is_default: false, can_disable: true, multi_instance: false, config: {} };

/** The Call config: the same agent read with ?type=inbound, with its own prompt, voice tools and call events. */
function callConfig(chat: any) {
  const agent = structuredClone(chat);
  const vd = agent.version_details[agent.active_agent_version_id];
  vd.agent_config.agent_prompt = { prompt_sections: CALL_PROMPT };
  vd.agent_config.intro_message = "Hi, this is Neha from Acme Lending. How can I help you today?";
  vd.on_call_tools = [endCallTool];
  vd.event_subscriptions = [{ event_type: ["call_completed", "recording_completed"], callback_url: "https://crm.acme-lending.example/hooks/ringg-calls", method_type: "POST", headers: {} }];
  return agent;
}

/** Agent editor, Integrations → WhatsApp and Test assistant for the WhatsApp concierge with calling on. */
export function makeWhatsappCallingEditorRoutes() {
  const base = makeWhatsappEditorRoutes() as Record<string, any>;
  let call: any = null;
  return {
    ...base,
    "GET /workspace/features": FEATURES,
    "GET /agent/*": (url: URL) => {
      const res = base["GET /agent/*"](url);
      if (url.searchParams.get("type") !== "inbound" || res.agents?.id !== WA_ID) return res;
      call ??= callConfig(res.agents);
      return { agents: call };
    },
    "GET /whatsapp/embedded-signup/agents/*/calling": agentCalling,
    "PUT /whatsapp/embedded-signup/agents/*/calling": (_u: URL, b: any) => ({ ...agentCalling, calling: { ...agentCalling.calling, settings: { ...agentCalling.calling.settings, status: b?.enabled ? "ENABLED" : "DISABLED" } } }),
    "GET /whatsapp/embedded-signup/*/numbers": { numbers },
    "GET /whatsapp/embedded-signup/*/numbers/*/calling": (url: URL) => CALLING[url.pathname.split("/").at(-2)!] ?? CALLING.wa_pn_40322,
  } as Record<string, unknown>;
}

// --- Logs → WhatsApp: three WhatsApp calls among the chats. ---
const AGENT = agentsWithVersions.find((a) => a.id === "agt_whatsapp")!;
const VERSION = AGENT.versions[0];
const BUSINESS = "+919876540321";
const istToIso = (ist: string) => new Date(ist.replace(" ", "T") + "+05:30").toISOString();

type CallRow = [id: string, name: string, num: string, ist: string, dur: number];
const callRows: CallRow[] = [
  ["6d2f8b1a-4c7e-4a39-9b5d-0e8c3f1a7d42", "Kiran Desai", "+919876545520", "2026-10-06 11:36:02", 132],
  ["a3e9c5d7-1b4f-4e8a-8c2d-7f0b6e9a3c15", "Meena Pillai", "+919876545588", "2026-10-06 10:31:47", 74],
  ["f7b1d3e5-9a2c-4d6e-b8f0-2c4e6a8d0f39", "Rohit Bhatia", "+919876545641", "2026-10-05 16:18:30", 188],
];
export const waCalls = callRows.map(([id, name, num, ist, dur]) => ({
  kind: "call", id, name, to_number: BUSINESS, inbound_from: num, call_cost: Math.round((dur / 60) * 650) / 100, currency: "INR",
  created_at: istToIso(ist), call_attempt_time: istToIso(ist), transcript: "", audio_recording: null, call_duration: dur, call_type: "inbound", credits_processed: true,
  agent: { id: AGENT.id, agent_name: AGENT.agent_display_name, orchestration_mode: "single_node", version: { version_id: VERSION.version_id, version_slug: VERSION.version_slug } },
  from_numbers: [BUSINESS], voicemail_detected: false, bulk_list_id: "", status: "completed", next_attempt_time: null, frequency_deferred_at: null,
  cancelled_by_callee_limit: false, is_callback: false, has_call_attempts: false, calling_source: "whatsapp",
}));
const featured = waCalls[0];
const start = new Date(featured.created_at).getTime();

const turns: [who: "bot" | "user", text: string, offsetMs: number][] = [
  ["bot", "Hi Kiran, this is Neha from Acme Lending. How can I help you today?", 700],
  ["user", "Hi. I got a message that my EMI is due. Can I pay it a few days late?", 5200],
  ["bot", "I can help with that. Your EMI of twelve thousand four hundred and fifty rupees is due on the tenth of October. Paying up to three days late adds a late fee of five hundred rupees.", 11400],
  ["user", "Okay, then I'll pay on time. Can you send me the link?", 24800],
  ["bot", "Sure. I'll send the payment link to this WhatsApp chat right after our call. It stays valid for twenty-four hours.", 29300],
  ["user", "Great, thanks.", 38600],
  ["bot", "You're welcome, Kiran. Have a good day!", 40900],
];
const transcript = turns.map(([who, text, off], i) => ({ [who]: text, message_id: `wc_${String(i + 1).padStart(2, "0")}`, timestamp: new Date(start + off).toISOString(), audio_offset_ms: off }));

const analysis = (id: string) => {
  const c = waCalls.find((x) => x.id === id) ?? featured;
  const isFeatured = c.id === featured.id;
  return {
    call_details: {
      duration: String(c.call_duration), start_time: c.created_at, end_time: new Date(new Date(c.created_at).getTime() + c.call_duration * 1000).toISOString(), agent_type: "inbound",
      first_tts_time: 0.58, custom_args_values: { customer_name: c.name, loan_account: "PL-5174" }, overall_latency: 0.81, participants: { user: c.name, assistant: AGENT.agent_display_name },
    },
    general_analysis_status: true,
    general_analysis: {
      summary: isFeatured
        ? "Kiran called from WhatsApp to ask whether the EMI for loan PL-5174 could be paid late. After hearing about the late fee, he chose to pay on time and asked for the payment link, which the agent promised to send in the WhatsApp chat."
        : `${c.name} called the WhatsApp concierge about loan PL-5174.`,
      key_points: isFeatured ? ["EMI of ₹12,450 due on 10 October", "Late fee of ₹500 explained", "Customer will pay on time", "Payment link to be sent on WhatsApp"] : [],
      classification: isFeatured ? "Payment link requested" : "Information shared",
      action_items: isFeatured ? ["Send the payment link in the WhatsApp chat"] : [],
      call_disconnect_reason: "Agent ended the call after the customer said goodbye", callback_requested_time: "", sentiment: "Positive",
      sentiment_reason: "The customer was satisfied with the answer and agreed to pay on time.", timezone: "Asia/Kolkata",
    },
    client_analysis_status: true,
    client_analysis: { payment_completed: false, callback_requested: false },
    call_feedback: null,
  };
};

// A chat's turn counts, roughly one message per 25 seconds of chat.
const withTurns = (chat: any) => {
  const turns = Math.max(2, Math.round((chat.call_duration ?? 0) / 25));
  return { ...chat, customer_turns: Math.ceil(turns / 2), bot_turns: Math.floor(turns / 2) };
};
const newestFirst = (rows: any[]) => [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));

/** Logs → WhatsApp with the Type filter: kind=all|chats|calls. */
export function makeWhatsappCallingLogsRoutes() {
  const base = whatsappChatRoutes as Record<string, any>;
  const isWaCall = (id: string | null) => waCalls.some((c) => c.id === id);
  return {
    ...base,
    "GET /workspace/features": FEATURES,
    "GET /chat/history/v2": (url: URL) => {
      const kind = url.searchParams.get("kind") ?? "all";
      const page = base["GET /chat/history/v2"](url);
      if (url.searchParams.get("download")) return page;
      const chatRows = kind === "calls" ? [] : page.calls.map(withTurns);
      if (kind === "chats") return { ...page, calls: chatRows };
      const list = newestFirst([...chatRows, ...waCalls]);
      return { limit: 100, count: list.length, total: list.length === chats.length + waCalls.length ? 519 : list.length, offset: 0, calls: list };
    },
    "GET /calling/call-details": (url: URL) => {
      const id = url.searchParams.get("id");
      if (!isWaCall(id)) return base["GET /calling/call-details"](url);
      return { status: "success", data: { recording_url: placeholderRecording(), transcription_url: JSON.stringify(id === featured.id ? transcript : transcript.slice(0, 2)) } };
    },
    "GET /calling/analysis/*": (url: URL) => {
      const id = url.pathname.split("/").at(-1)!;
      return isWaCall(id) ? analysis(id) : base["GET /calling/analysis/*"](url);
    },
    "GET /tools/call-logs/*": (url: URL) => (isWaCall(url.pathname.split("/").at(-1)!) ? [] : base["GET /tools/call-logs/*"](url)),
  } as Record<string, unknown>;
}

// --- Analytics → WhatsApp. ---
const noise = (i: number, seed = 1) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
function days(url: URL) {
  const out: string[] = [];
  const end = new Date((url.searchParams.get("end_date") ?? "2026-10-06") + "T00:00:00Z");
  for (let d = new Date((url.searchParams.get("start_date") ?? "2026-09-06") + "T00:00:00Z"); d <= end; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}
const isWeekend = (day: string) => [0, 6].includes(new Date(day + "T00:00:00Z").getUTCDay());
const md = (count: number, delta: number | null) => ({ count, previous: Math.round(count * 0.85 * 100) / 100, delta_pct: delta });

function whatsappCallVolume(url: URL) {
  const by_bucket = days(url).map((bucket, i) => {
    const total = Math.round((14 + noise(i, 7) * 9) * (isWeekend(bucket) ? 0.5 : 1));
    const completed = Math.round(total * (0.86 + noise(i, 8) * 0.08));
    return { bucket, total, attempted: total, completed, failed: total - completed, cancelled: 0, registered: 0, ongoing: 0, retry: 0 };
  });
  const total = by_bucket.reduce((n, b) => n + b.total, 0);
  const connected = by_bucket.reduce((n, b) => n + b.completed, 0);
  const aht = 118;
  const zero = md(0, null);
  return {
    volume: {
      total: md(total, 18.2), callback_count: zero, registered: zero, ongoing: zero, retry: zero, not_dialed: zero, attempted: md(total, 18.2), attempts_incl_retries: md(total, 18.2),
      connected: md(connected, 21.5), failed: md(total - connected, -4.1), cancelled: zero, connection_rate: md(Math.round((connected / total) * 1000) / 1000, 2.6), voicemail: zero,
      aht_seconds: md(aht, 6.3), total_minutes: md(Math.round((connected * aht) / 60), 24.8), unique_numbers_used: md(1, 0), chat_total: zero, total_interactions: md(total, 18.2), by_bucket,
    },
  };
}

function chatAnalytics(url: URL) {
  const by_bucket = days(url).map((bucket, i) => {
    const count = Math.round((62 + noise(i, 3) * 30) * (isWeekend(bucket) ? 0.6 : 1));
    const engaged = Math.round(count * (0.78 + noise(i, 4) * 0.1));
    return { bucket, count, engaged, resolved: Math.round(engaged * 0.74) };
  });
  const sum = (key: "count" | "engaged" | "resolved") => by_bucket.reduce((n, b) => n + b[key], 0);
  return { volume: { total: sum("count"), by_bucket }, channel_split: { whatsapp: sum("count") }, outcomes: { initiated: sum("count"), engaged: sum("engaged"), resolved: sum("resolved"), avg_session_seconds: 412, avg_turns: 7.4, goal_rate: 0.46, positive_sentiment_share: 0.71 } };
}

function overview(url: URL) {
  const list = days(url);
  const by_day = list.map((date, i) => {
    const sent = Math.round((180 + noise(i, 11) * 90) * (isWeekend(date) ? 0.55 : 1));
    return { date, sent, delivered: Math.round(sent * 0.96) };
  });
  const sent = by_day.reduce((n, d) => n + d.sent, 0);
  const delivered = by_day.reduce((n, d) => n + d.delivered, 0);
  const spendDays = list.map((date, i) => {
    const paid = Math.round(55 + noise(i, 13) * 25);
    return { date, free: Math.round(120 + noise(i, 12) * 40), paid, cost: Math.round(paid * 14.5) / 100 };
  });
  const paid = spendDays.reduce((n, d) => n + d.paid, 0);
  return {
    currency: "INR", cost_available: true,
    delivery: { sent, delivered, delivery_rate: delivered / sent, by_day },
    spend: {
      free_messages: spendDays.reduce((n, d) => n + d.free, 0), paid_messages: paid, total_cost: Math.round(spendDays.reduce((n, d) => n + d.cost, 0) * 100) / 100,
      by_category: [{ pricing_category: "UTILITY", volume: paid, cost: Math.round(paid * 14.5) / 100 }, { pricing_category: "SERVICE", volume: 3120, cost: 0 }],
      by_day: spendDays,
    },
  };
}

function templates(url: URL) {
  const list = days(url);
  const row = (template_id: string, name: string, sent: number, read: number, clicked: number, spend: number) => {
    const delivered = Math.round(sent * 0.97);
    return { template_id, name, category: "UTILITY", language: "en", status: "APPROVED", quality: "GREEN", sent, delivered, read, clicked, read_rate: read / delivered, click_rate: clicked / delivered, spend };
  };
  return {
    available: true, reason: null, start_date: list[0], end_date: list.at(-1), clamped: false, currency: "INR", cost_available: true,
    templates: [row("wat_emi_due_reminder", "emi_due_reminder", 4210, 3380, 1420, 610.45), row("wat_payment_receipt", "payment_receipt", 1870, 1510, 0, 271.15)],
    by_day: list.map((date, i) => ({ date, category: "UTILITY", sent: Math.round(190 + noise(i, 21) * 60), delivered: Math.round(184 + noise(i, 21) * 58), read: Math.round(150 + noise(i, 22) * 40), clicked: Math.round(40 + noise(i, 23) * 25) })),
  };
}

/** Analytics → WhatsApp: the account and its numbers, chats, Meta delivery and spend, templates, and WhatsApp calls. */
export function makeWhatsappCallingAnalyticsRoutes() {
  const base = analyticsRoutes as Record<string, any>;
  return {
    ...base,
    "GET /workspace/features": FEATURES,
    "GET /whatsapp/insights/accounts": {
      accounts: [{
        telephony_account_id: WA_ACCOUNT_ID, name: "Acme Lending", waba_id: WA_WABA_ID,
        numbers: [
          { phone_number_id: "wa_pn_40321", number: "+919876540321", agent_id: "agt_whatsapp", agent_name: "WhatsApp concierge" },
          { phone_number_id: "wa_pn_40322", number: "+919876540322", agent_id: null, agent_name: null },
        ],
      }],
    },
    "GET /whatsapp/insights/overview": (url: URL) => overview(url),
    "GET /whatsapp/insights/templates": (url: URL) => templates(url),
    "GET /analytics/v4/chat-analytics": (url: URL) => chatAnalytics(url),
    "GET /analytics/v4/volume-graph": (url: URL) => (url.searchParams.get("channel") === "whatsapp" ? whatsappCallVolume(url) : base["GET /analytics/v4/volume-graph"](url)),
  } as Record<string, unknown>;
}

/** Every page the scenario opens. The editor's agent list and numbers win; Logs needs the agents with their versions. */
export function makeWhatsappCallingRoutes() {
  const logs = makeWhatsappCallingLogsRoutes();
  const editor = makeWhatsappCallingEditorRoutes() as Record<string, any>;
  return {
    ...makeWhatsappCallingAnalyticsRoutes(),
    ...logs,
    ...editor,
    "GET /agent/all": logs["GET /agent/all"],
    // The call panel loads its row by call_id.
    "GET /calling/history/v2": (url: URL) => {
      const call = waCalls.find((c) => c.id === url.searchParams.get("call_id"));
      return call ? { limit: 10, count: 1, total: 1, offset: 0, calls: [call] } : editor["GET /calling/history/v2"](url);
    },
  } as Record<string, unknown>;
}
