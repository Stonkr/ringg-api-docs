// Web chat history fixtures. Two sides of one feature:
// - The web widget's History calls on a fictional customer site. Shapes follow the widget's API client
//   (listConversations / getConversationMessages) and its contract §12: POST /calling/webcall/conversations
//   → { enabled, conversations: [{ conversation_id, title, last_message_preview, last_activity_at }] },
//   POST /calling/webcall/conversations/{id}/messages → { messages: [{ bot | user, timestamp?, widget? }], ongoing_call_id }.
// - Logs → Webchat: GetHistoryResponse rows carrying a WebchatConversationSummary, call-details with
//   include_conversation (ConversationSession[] + the merged transcript + WebchatTotals) and ToolLog[] across
//   every session (types/history.types.ts, lib/api/history.api.ts).
// Fictional data only: Acme Lending, Priya Sharma, +91 98765 4xxxx.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { calls, historyHandler, logsRoutes } from "./monitor.ts";

// ─── The widget on a customer's site ─────────────────────────────────────────

export const ACME_SITE = "https://www.acme-lending.example/";

const ist = (day: number, time: string) => new Date(`2026-10-0${day}T${time.length === 5 ? `${time}:00` : time}+05:30`).toISOString();

const conversations = [
  { conversation_id: "00000000-0000-4000-8000-000000000301", title: "EMI for a ₹5 lakh personal loan", last_message_preview: "At 10.5% a year, your EMI would be about ₹10,600 a month over 5 years.", last_activity_at: ist(6, "11:03") },
  { conversation_id: "00000000-0000-4000-8000-000000000302", title: "Prepaying my home loan", last_message_preview: "Part-prepayment has no charge on a floating-rate home loan.", last_activity_at: ist(4, "16:45") },
  { conversation_id: "00000000-0000-4000-8000-000000000303", title: "Callback about a gold loan", last_message_preview: "Booked: a call on 3 October at 11:00 AM.", last_activity_at: ist(2, "14:35") },
];

// The block widget the agent showed, stored on its "Showed …" line (BlocksToolConfig blocks).
const loanPicker = {
  component_type: "render_component_blocks",
  component_config: {
    schema_version: 1,
    blocks: [
      { type: "header", props: { text: "Which loan is it for?" } },
      {
        type: "column",
        children: ["Personal loan", "Home loan", "Gold loan"].map((label) => ({ type: "button", props: { label }, on: { press: { action: "respond", action_id: "pick_loan", value: label } } })),
      },
    ],
  },
};

const widgetMessages: Record<string, unknown[]> = {
  "00000000-0000-4000-8000-000000000301": [
    { bot: "Hi Priya! I'm Asha from Acme Lending. How can I help you today?", timestamp: ist(6, "11:02") },
    { user: "What would my EMI be on a 5 lakh loan?" },
    { bot: "Showed Which loan is it for? — 1. Personal loan 2. Home loan 3. Gold loan", timestamp: ist(6, "11:02"), widget: loanPicker },
    { user: "Personal loan" },
    { bot: "At 10.5% a year, your EMI would be about **₹10,600 a month** over 5 years.", timestamp: ist(6, "11:03") },
  ],
};

/** Opens the fictional site with the real web widget bundle, its History calls answered from the fixtures above.
 *  WIDGET_DIST is the web widget package's bundle folder (its `vite build` output: dv-agent.umd.js and style.css). */
export async function openAcmeSite(page: Page) {
  const dist = process.env.WIDGET_DIST;
  if (!dist || !existsSync(join(dist, "dv-agent.umd.js"))) throw new Error("Set WIDGET_DIST to the built web widget bundle folder (dv-agent.umd.js, style.css)");
  await page.route(`${ACME_SITE}**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith("/ringg/")) return route.fulfill({ body: readFileSync(join(dist, path.slice("/ringg/".length))), contentType: path.endsWith(".css") ? "text/css" : "application/javascript" });
    return route.fulfill({ body: ACME_PAGE, contentType: "text/html" });
  });
  // The widget's production backend; nothing reaches it.
  await page.route("https://prod-api.ringg.ai/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/calling/webcall/conversations")) return route.fulfill({ json: { enabled: true, conversations } });
    const opened = path.match(/conversations\/([^/]+)\/messages$/);
    if (opened) return route.fulfill({ json: { messages: widgetMessages[opened[1]] ?? [], ongoing_call_id: null } });
    return route.fulfill({ json: {} });
  });
  await page.goto(ACME_SITE, { waitUntil: "networkidle" });
}

const ACME_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Acme Lending</title>
  <link rel="stylesheet" href="/ringg/style.css" />
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; color: #0f172a; background: #f8fafc; }
    header { display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; background: #fff; border-bottom: 1px solid #e2e8f0; }
    header b { font-size: 20px; color: #1d4ed8; }
    nav a { margin-left: 24px; color: #334155; font-size: 15px; }
    main { padding: 64px 48px; max-width: 560px; }
    h1 { font-size: 38px; line-height: 1.15; margin: 0 0 16px; }
    p { font-size: 18px; color: #475569; line-height: 1.6; }
    .cta { display: inline-block; margin-top: 16px; padding: 14px 22px; background: #1d4ed8; color: #fff; border-radius: 10px; font-weight: 600; }
  </style>
</head>
<body>
  <header><b>Acme Lending</b><nav><a>Personal loans</a><a>Home loans</a><a>EMI calculator</a><a>Support</a></nav></header>
  <main>
    <h1>Loans that fit your month</h1>
    <p>Check your EMI, compare loan offers and get a callback from our team. Ask our assistant anything about your loan.</p>
    <span class="cta">Check my offer</span>
  </main>
  <script src="/ringg/dv-agent.umd.js"></script>
  <script>
    window.loadAgent({
      agentId: "00000000-0000-4000-8000-000000000210",
      authorization: "Bearer pk_live_example",
      defaultTab: "text",
      hideTabSelector: true,
      title: "Acme Lending Help",
      description: "Ask about your EMI or loan",
    });
  </script>
</body>
</html>`;

// ─── Logs → Webchat ──────────────────────────────────────────────────────────

export const FEATURED_CHAT_ID = "6b2e9f41-3c7a-4d58-9e10-2f8a6c4b7d93";
const SESSION_IDS = [FEATURED_CHAT_ID, "6b2e9f41-3c7a-4d58-9e10-2f8a6c4b7d94", "6b2e9f41-3c7a-4d58-9e10-2f8a6c4b7d95"];

// The tab lists one row per chat: its first session, with totals across every session.
const webcallRow = calls.find((call) => call.call_type === "webcall")!;
type Chat = [id: string, name: string, startedIst: [number, string], lastIst: [number, string], sessions: number, user: number, agent: number, cost: number, status: string];
const chats: Chat[] = [
  [FEATURED_CHAT_ID, "Priya Sharma", [6, "11:02"], [7, "10:06"], 3, 4, 6, 3.9, "completed"],
  ["9d4a1c7e-2b5f-4e83-a6d0-7c1e3f9b5a20", "", [7, "09:41"], [7, "09:44"], 1, 2, 3, 0.85, "ongoing"],
  ["1f8c5e2a-7d3b-4a96-b4e1-0a6d2c8f3e57", "Rohan Gupta", [5, "17:20"], [6, "12:10"], 2, 5, 6, 2.6, "completed"],
  ["c2e7a9d1-5f4b-4c08-8b3a-9e1d6f2a4c86", "", [5, "14:08"], [5, "14:11"], 1, 1, 2, 0.4, "completed"],
  ["8b3f6d0a-4e2c-4f71-9d85-3a7e0c5b1f42", "Neha Bhatt", [4, "19:30"], [4, "19:37"], 1, 3, 4, 1.15, "completed"],
];
const chatRows = chats.map(([id, name, [startDay, startTime], [lastDay, lastTime], session_count, user_turns, agent_turns, total_cost, status]) => ({
  ...webcallRow,
  id,
  name: name || null,
  to_number: "",
  status,
  created_at: ist(startDay, startTime),
  call_attempt_time: ist(startDay, startTime),
  call_cost: total_cost,
  call_duration: 60 * session_count + 90,
  conversation: {
    conversation_id: id,
    session_count,
    started_at: ist(startDay, startTime),
    last_activity_at: ist(lastDay, lastTime),
    total_cost,
    total_turns: user_turns + agent_turns,
    user_turns,
    agent_turns,
    status,
  },
}));

// The featured chat: three sessions, each continued from the widget's History.
const sessions: [day: number, time: string, turns: [who: "bot" | "user", text: string, time?: string][]][] = [
  [6, "11:02", [
    ["bot", "Hi Priya! I'm Asha from Acme Lending. How can I help you today?", "11:01:50"],
    ["user", "What would my EMI be on a 5 lakh loan?"],
    ["bot", "Showed Which loan is it for? — 1. Personal loan 2. Home loan 3. Gold loan", "11:02"],
    ["user", "Personal loan"],
    ["bot", "At 10.5% a year, your EMI would be about ₹10,600 a month over 5 years.", "11:03"],
  ]],
  [6, "18:20", [
    ["user", "Can I see it for 3 years instead?"],
    ["bot", "Over 3 years it comes to about ₹16,250 a month.", "18:21"],
  ]],
  [7, "10:05", [
    ["user", "Please arrange a callback for the 3-year option"],
    ["bot", "Done. Our loan advisor will call you today at 4:00 PM on +91 98765 43210.", "10:06"],
  ]],
];
const sessionTurns = sessions.map(([day, , turns], index) =>
  turns.map(([who, text, time], position) => ({ [who]: text, message_id: `m${index + 1}-${position + 1}`, ...(time ? { timestamp: ist(day, time) } : {}) })),
);
const featuredDetails = () => {
  let firstMessageIndex = 0;
  const described = sessions.map(([day, time, turns], index) => {
    const session = { call_id: SESSION_IDS[index], initiation_time: ist(day, time), status: "completed", call_duration: 60 * (index + 2), first_message_index: firstMessageIndex };
    firstMessageIndex += turns.length;
    return session;
  });
  return {
    status: "success",
    data: {
      recording_url: null,
      transcription_url: JSON.stringify(sessionTurns[0]),
      call_status: "completed",
      conversation: { conversation_id: FEATURED_CHAT_ID, sessions: described, transcription_url: JSON.stringify(sessionTurns.flat()), total_cost: 3.9, user_turns: 4, agent_turns: 6 },
    },
  };
};

const toolLog = (id: string, session: number, tool_name: string, tool_type: string, phase: "pre_call" | "on_call", executed_at: string, request_params: unknown, response_data: unknown, latency_ms: number | null) => ({
  id, call_id: SESSION_IDS[session], message_id: null, workspace_id: "ws_acme_lending", node_id: null, source_node_label: null, target_node_label: null,
  tool_name, tool_phase: phase, tool_type, request_params, response_data, jq: null, status_code: latency_ms === null ? null : 200,
  execution_status: "success", latency_ms, executed_at, created_at: executed_at, updated_at: executed_at,
});
const featuredToolLogs = [
  toolLog("tl_wch_1", 0, "fetch_customer_profile", "api_tool", "pre_call", ist(6, "11:01"), { customer_id: "CUST-20417" }, { name: "Priya Sharma", city: "Pune" }, 182),
  toolLog("tl_wch_2", 0, "send_blocks", "custom_function", "on_call", new Date(Date.parse(ist(6, "11:02")) + 500).toISOString(), { block: "loan_picker" }, { status: "shown" }, null),
  toolLog("tl_wch_3", 1, "fetch_customer_profile", "api_tool", "pre_call", ist(6, "18:19"), { customer_id: "CUST-20417" }, { name: "Priya Sharma", city: "Pune" }, 175),
  toolLog("tl_wch_4", 1, "emi_calculator", "api_tool", "on_call", new Date(Date.parse(ist(6, "18:21")) - 2000).toISOString(), { principal: 500000, rate: 10.5, months: 36 }, { emi: 16251 }, 96),
  toolLog("tl_wch_5", 2, "fetch_customer_profile", "api_tool", "pre_call", ist(7, "10:04"), { customer_id: "CUST-20417" }, { name: "Priya Sharma", city: "Pune" }, 168),
  toolLog("tl_wch_6", 2, "schedule_callback", "api_tool", "on_call", new Date(Date.parse(ist(7, "10:06")) - 3000).toISOString(), { phone: "+919876543210", slot: "2026-10-07T16:00:00+05:30" }, { booked: true }, 241),
];

export const webchatLogsRoutes = {
  ...logsRoutes,
  "GET /calling/history/v2": (url: URL) => {
    // The drawer looks its row up by call_id.
    const byId = chatRows.filter((row) => row.id === url.searchParams.get("call_id"));
    if (byId.length) return { limit: 100, count: 1, total: 1, offset: 0, calls: byId };
    return url.searchParams.get("only_webchats") === "true" ? { limit: 100, count: chatRows.length, total: 128, offset: 0, calls: chatRows } : historyHandler(url);
  },
  "GET /calling/call-details": (url: URL) => {
    if (url.searchParams.get("id") === FEATURED_CHAT_ID) return featuredDetails();
    return (logsRoutes["GET /calling/call-details"] as (u: URL) => unknown)(url);
  },
  "GET /tools/call-logs/*": (url: URL) => (url.pathname.endsWith(FEATURED_CHAT_ID) ? featuredToolLogs : []),
  "GET /calling/analysis/*": (url: URL) => {
    if (!url.pathname.endsWith(FEATURED_CHAT_ID)) return (logsRoutes["GET /calling/analysis/*"] as (u: URL) => unknown)(url);
    const started = ist(6, "11:01:50");
    return {
      call_details: { duration: "420", start_time: started, end_time: ist(7, "10:06"), agent_type: "webcall", first_tts_time: 0.6, custom_args_values: { callee_name: "Priya Sharma", customer_id: "CUST-20417" }, overall_latency: 0.84, participants: { user: "Priya Sharma", assistant: "Website assistant" } },
      general_analysis_status: true,
      general_analysis: { summary: "Priya asked for the EMI on a ₹5 lakh personal loan, came back to compare a 3-year tenure, and then booked a callback with a loan advisor.", key_points: ["EMI quoted for 5 and 3 years", "Callback booked for 7 October, 4:00 PM"], classification: "Callback booked", action_items: ["Advisor to call at 4:00 PM"], call_disconnect_reason: "Visitor closed the chat", callback_requested_time: "", timezone: "Asia/Kolkata" },
      client_analysis_status: true,
      client_analysis: {},
      call_feedback: null,
    };
  },
};
