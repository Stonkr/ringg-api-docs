// Single-prompt agent editor fixtures, part 2: Call settings, Tools, Advanced Analysis, Event Subscription,
// Embed & Widgets and Attach Number. Shapes follow the production source: AgentInfoResponse / AgentVersionDetails
// (types/agent.types.ts), ApiToolFieldsResponse, BlocksToolConfig (types/blocks.types.ts), GetHistoryResponse,
// GetDemoAnalysisResponse, AgentCallFrequencyPolicy. Fictional data only.
// Call makeEditorBRoutes() once per scenario: PATCH agent/v1 writes into an in-memory copy, so saves survive refetches.
import { NOW } from "./common.ts";
import { agentRoutes, agents } from "./agents.ts";

// The breadcrumb only resolves UUID ids, so the two editor agents get UUIDs.
export const PR_ID = "3f6b2d1e-8a4c-4f7e-b1d2-6c9e0a7b5f41"; // agt_payment_reminder (outbound)
export const SL_ID = "b7e4c2a9-1d3f-4e8b-a6c5-2f9d8e7a1c30"; // agt_support_line (inbound)
const idMap: Record<string, string> = { agt_payment_reminder: PR_ID, agt_support_line: SL_ID };
const listAgents = agents.map((a) => ({ ...a, id: idMap[a.id] ?? a.id }));
const V_PR = "c41d9e72-6b0a-4f3e-9a15-7e2b8d4c0f63";
const V_SL = "e93a5b17-2c4d-4b8f-8e60-1f7a9c3d5b28";

const sections = (s: [string, string][]) => ({ prompt_sections: s.map(([section_title, section_content]) => ({ section_title, section_content })) });
const v = (key: string, value: string) => ({ key, value, type: "variable" as const });
const st = (key: string, value: string) => ({ key, value, type: "static" as const });

// System tools the backend offers on the On-call tab (available_tools).
const systemTool = (tool_type: string, tool_name: string, display_description: string, config: Record<string, unknown> = {}, multi_instance = false) => ({
  tool_id: `sys_${tool_name}`,
  tool_type,
  tool_name,
  tool_phase: "on_call",
  description: display_description,
  display_description,
  is_enabled: false,
  is_default: false,
  can_disable: true,
  multi_instance,
  config,
});
const availableTools = [
  systemTool("DTMF_TOOL", "dtmf", "Send keypad tones on the call", {}, true),
  systemTool("CALL_TRANSFER_TOOL", "call_transfer", "Transfer the caller to a person or another line", {
    destinations: [],
    business_hours: { start_time: "08:00", end_time: "16:00", timezone: "Asia/Kolkata", outside_hours_message: { en: "Transfers are unavailable outside business hours." } },
    post_transfer_behavior: "end_call",
  }),
  systemTool("WAIT_FOR_DTMF_TOOL", "wait_for_dtmf", "Wait for the caller to type digits on the keypad", { digits: 6, end: "#", reset: "*", timeout: 10 }, true),
  systemTool("COLLECT_LONG_INPUT_TOOL", "collect_long_input", "Let the caller give a long answer without interruption"),
  systemTool("STAY_ON_LINE_TOOL", "stay_on_line", "Wait silently while the caller holds", { duration_seconds: 30 }, true),
  systemTool("END_CALL_TOOL", "end_call", "Hang up after a closing line"),
];

function baseVersion(id: string, o: Record<string, unknown>) {
  return {
    version_id: id,
    version_slug: "v1",
    description: "Live version",
    call_traffic: "100",
    whitelisted_domains: ["https://www.ringg.ai", "https://www.acme-lending.example"],
    language: "en-IN",
    voice: { id: "voc_ananya", name: "Ananya", voice_preview: "", image_url: "" },
    secondary_language: "hi-IN",
    secondary_voice_id: "voc_ananya",
    additional_languages: [],
    tools: [],
    knowledge_bases: [],
    knowledge_base_id: null,
    knowledge_base_name: null,
    record_locally: false,
    chat_config: { max_call_length: 600, idle_timeout_warning: 60, idle_timeout_end: 120 },
    custom_analysis_prompt: { prompt: "", keys: {} },
    available_tools: availableTools,
    analytics_context: { client_analytics: { tool_call_logs: false } },
    created_at: "2026-09-01T10:00:00Z",
    updated_at: NOW,
    ...o,
  };
}

const blocksWidget = (tool_id: string, tool_name: string, widget_description: string, blocks: unknown[], extra: Record<string, unknown> = {}) => ({
  tool_type: "BLOCKS_WIDGET_TOOL", tool_id, tool_name, widget_description, description: widget_description, is_enabled: true, supports_multiple_configs: true,
  channel_type: "webcall", tool_phase: "on_call", tool_category: "embeded_tool", suppress_agent_text: true, blocks, params: [], api_config: {}, ...extra,
});
const respond = (id: string, value?: string) => ({ press: { action: "respond", action_id: id, ...(value ? { value } : {}) } });

function paymentReminder() {
  return {
    ...listAgents.find((a) => a.id === PR_ID)!,
    is_ab_live: false,
    ab_versions: { [V_PR]: { slug: "v1", description: "Live version", call_traffic: 100 } },
    inbound_number_id: "",
    telephony_id: "",
    webcall_public_key: "wk_live_7f3c9a12d84e4b6f",
    active_agent_version_id: V_PR,
    version_details: {
      [V_PR]: baseVersion(V_PR, {
        agent_config: {
          vocab: ["EMI", "NACH", "Acme Lending"],
          voice_speed: 1,
          agent_prompt: sections([
            ["Role", "You are Ananya, a polite collections assistant for Acme Lending. You remind customers about upcoming EMI payments."],
            ["Task", "Confirm you are speaking with {{customer_name}}, remind them that their EMI of ₹{{emi_amount}} is due on {{due_date}}, and ask when they will pay."],
          ]),
          interruption_sensitivity: "default",
          dtmf_settings: { dtmf_capturing_enabled: false, dtmf_input: { end: "#", reset: "*", digits: 6, timeout: 5 } },
          intro_message: "Hello, this is Ananya from Acme Lending. Am I speaking with {{customer_name}}?",
          mute_while_bot_speaking: false,
          mute_during_intro: false,
          custom_variables: ["customer_name", "emi_amount", "due_date", "loan_id", "mobile_number"],
          pre_query_response_phrases: ["One moment, let me check that."],
          llm: { provider: "openai", model: "gpt-4.1" },
          is_demo_enabled: false,
          rate_limit: null,
        },
        call_config: {
          call_time: { call_start_time: "09:00", call_end_time: "19:00", timezone: "Asia/Kolkata" },
          voicemail: { detect: true, action: "end", retry: true },
          max_call_length: 300,
          idle_timeout_end: 20,
          idle_timeout_warning: 10,
          noise_filter_config: { filter_noise: true, noise_suppression_level: 80 },
          timeout_msg_on: false,
          timeout_msg_dur: 12,
          timeout_texts: { "en-IN": "We are almost out of time, so let me quickly sum up what we agreed." },
          background_audio_config: { audio_id: "office_ambience", volume: 0.3, mixing: false, loop: true },
        },
        client_analysis: {
          context: "A promise to pay counts only if the customer names a specific date.",
          goal_key: null,
          keys: {
            promised_date: { type: "date", description: "The date the customer promised to pay, if any.", default: null },
            objection: { type: "enum", values: ["already_paid", "no_money", "dispute", "none"], description: "The customer's main reason for not paying.", default: "none" },
          },
        },
        event_subscriptions: [
          { event_type: ["call_completed", "client_analysis_completed"], callback_url: "https://crm.acme-lending.example/hooks/ringg", method_type: "POST", headers: { "X-Acme-Source": "ringg" } },
        ],
        pre_call_tools: [],
        on_call_tools: [
          {
            tool_id: "tl_check_payment", tool_name: "check_payment_status", description: "Checks whether the EMI for this loan has already been paid.", tool_type: "API_TOOL", tool_phase: "on_call", is_enabled: true, execution_order: 0,
            config: { url: "https://api.acme-lending.example/v1/loans/{loan_id}/payments", method: "GET", headers: [st("Authorization", "Bearer acme_live_****")], path: [v("loan_id", "loan_id")], query: [], body: [], timeout_ms: 5000 },
          },
          { ...availableTools.find((t) => t.tool_type === "END_CALL_TOOL")!, tool_id: "tl_end_call", is_enabled: true, description: "End the call once the customer has confirmed a payment date or asked not to be called.", pre_call_message: { en: "Thank you for your time. Have a good day!" } },
        ],
        post_call_tools: [
          {
            tool_id: "tl_update_crm", tool_name: "update_crm", description: "Writes the call outcome to the Acme CRM.", tool_type: "API_TOOL", tool_phase: "post_call", trigger_point: "client_analysis", is_enabled: true, execution_order: 0,
            config: { url: "https://crm.acme-lending.example/api/calls", method: "POST", headers: [st("Authorization", "Bearer crm_live_****")], path: [], query: [], body: [v("loan_id", "loan_id"), v("summary", "summary"), v("promised_date", "promised_date")], body_content_type: "json", timeout_ms: 10000 },
          },
        ],
        embedded_on_call_tools: [
          blocksWidget("wt_payment_options", "payment_options", "Lets the customer choose how to pay the EMI.", [
            { type: "row", props: { gap: 8 }, children: [
              { type: "button", props: { label: "Pay now", style: "primary", width: 30 }, on: respond("pay_now") },
              { type: "button", props: { label: "Pay later", style: "secondary", width: 30 }, on: respond("pay_later") },
              { type: "button", props: { label: "Talk to an agent", style: "secondary", width: 36 }, on: respond("talk_to_agent") },
            ] },
          ]),
          blocksWidget("wt_update_contact", "update_contact", "Collects a new phone number and email for the loan account.", [
            { type: "card", children: [
              { type: "header", props: { text: "Update your contact details", level: 2 } },
              { type: "form", children: [
                { type: "input_phone_number", name: "phone", props: { label: "Phone number", required: true } },
                { type: "input_email", name: "email", props: { label: "Email" } },
                { type: "button", props: { label: "Submit", style: "primary" }, on: respond("submit_contact") },
              ] },
            ] },
          ]),
        ],
      }),
    },
  };
}

function supportLine() {
  return {
    ...listAgents.find((a) => a.id === SL_ID)!,
    is_ab_live: false,
    ab_versions: { [V_SL]: { slug: "v1", description: "Live version", call_traffic: 100 } },
    inbound_number_id: "",
    telephony_id: "",
    webcall_public_key: null,
    active_agent_version_id: V_SL,
    version_details: {
      [V_SL]: baseVersion(V_SL, {
        voice: { id: "voc_rohan", name: "Rohan", voice_preview: "", image_url: "" },
        agent_config: {
          vocab: ["Acme Lending", "foreclosure"],
          voice_speed: 1,
          agent_prompt: sections([["Role", "You are Rohan, the customer support assistant for Acme Lending. Answer questions about loans, EMIs and statements."]]),
          interruption_sensitivity: "default",
          dtmf_settings: { dtmf_capturing_enabled: false, dtmf_input: { end: "#", reset: "*", digits: 6, timeout: 5 } },
          intro_message: "Thank you for calling Acme Lending. How can I help you today?",
          mute_while_bot_speaking: false,
          mute_during_intro: false,
          custom_variables: [],
          pre_query_response_phrases: [],
          llm: { provider: "openai", model: "gpt-4.1" },
          is_demo_enabled: false,
          rate_limit: { action: "terminate", max_calls: 3, timeframe_minutes: 60, transfer_to: null, whitelisted_numbers: [] },
        },
        call_config: { max_call_length: 600, idle_timeout_end: 20, idle_timeout_warning: 10, noise_filter_config: { filter_noise: true }, voicemail: { detect: false, action: "end", retry: false } },
        client_analysis: null,
        event_subscriptions: [],
        pre_call_tools: [],
        on_call_tools: [],
        post_call_tools: [],
        embedded_on_call_tools: [],
      }),
    },
  };
}

// Numbers in the workspace (GET workspace/numbers). Numbers attached to other agents are filtered out by the editor.
const number = (id: string, n: string, provider: string, telephony_id: string, agent: { id: string; agent_display_name: string } | null, is_inbound_enabled = true, owner = "ringg") => ({
  id, number: n, created_at: "2026-08-12T10:00:00Z", agent, is_inbound_enabled, is_test_number: false, spam_message: "", tags: [], is_custom_number: false,
  owner, telephony_id, provider, number_pool_id: agent ? null : "pool_default", isExpired: false, expiry_date: "2026-11-01T00:00:00Z",
});

const historyCall = (id: string, name: string, to: string, minutesAgo: number, duration: number) => ({
  id, name, to_number: to, call_cost: 4.2, currency: "INR", created_at: new Date(Date.parse(NOW) - minutesAgo * 60_000).toISOString(), transcript: "", audio_recording: null,
  call_duration: duration, call_type: "outbound", call_attempt_time: NOW, credits_processed: true, inbound_from: null,
  agent: { id: PR_ID, agent_name: "Payment reminder", orchestration_mode: "single_node", version: { version_id: V_PR, version_slug: "v1" } },
  from_numbers: ["+919876541201"], voicemail_detected: false, bulk_list_id: "", status: "completed", next_attempt_time: null, is_callback: false,
});
const recentCalls = [
  historyCall("call_8f2a61d0", "Rahul Verma", "+919876543210", 42, 96),
  historyCall("call_7c19e4b3", "Sneha Iyer", "+919876543287", 75, 64),
  historyCall("call_6d0b5a92", "Arjun Mehta", "+919876543315", 130, 118),
  historyCall("call_5e93c7f1", "Kavya Nair", "+919876543342", 190, 41),
  historyCall("call_4a71d2e8", "Vikram Singh", "+919876543369", 260, 85),
];
const transcript = [
  { bot: "Hello, this is Ananya from Acme Lending. Am I speaking with Rahul Verma?" },
  { user: "Yes, speaking." },
  { bot: "Thank you, Rahul. This is a reminder that your EMI of ₹12,450 for loan AL-20931 is due on 5 October. When will you be able to pay?" },
  { user: "My salary comes in on the 7th. I can pay on the 8th." },
  { bot: "Understood. So you will pay ₹12,450 on 8 October. Is that correct?" },
  { user: "Yes, the 8th for sure." },
  { bot: "Thank you, Rahul. I've noted your payment date. Have a good day!" },
];

// Shared tools in the workspace library (GET workspace-tools).
const workspaceTool = (id: string, name: string, description: string, supported_phases: string[], method: string, url: string, attached_agent_count: number) => ({
  id, name, description, tool_type: "API_TOOL", supported_phases, overridable_params: [], is_enabled: true, attached_agent_count, created_at: "2026-08-20T09:00:00Z", updated_at: "2026-09-25T09:00:00Z",
  tools: { tool_name: name, description, tool_type: "API_TOOL", is_enabled: true, config: { url, method, headers: [st("Authorization", "Bearer acme_live_****")], path: [], query: [], body: [] } },
});

// Block types served by GET tools/v1/blocks-catalog (CatalogTypeEntry); props_schema drives the builder's inspector.
const str = { type: "string" };
const blockType = (description: string, props: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({ description, props_schema: { type: "object", properties: props }, ...extra });
const inputType = (description: string, value_type = "string") => blockType(description, { label: str, placeholder: str, required: { type: "boolean" } }, { input: { value_type } });
const blocksCatalog = {
  catalog_version: "1.4.0",
  schema_version: 1,
  types: {
    card: blockType("Bordered surface that groups blocks", {}, { container: true }),
    row: blockType("Items side by side", { gap: { type: "number" } }, { container: true }),
    column: blockType("Stacked items", { gap: { type: "number" } }, { container: true }),
    form: blockType("Groups inputs for one submit", {}, { container: true }),
    expander: blockType("Collapsible section", { title: str }, { container: true }),
    header: blockType("Prominent title text", { text: str, level: { type: "integer", enum: [1, 2, 3] } }),
    text: blockType("Body copy", { text: str }),
    image: blockType("Picture by URL", { url: str, alt: str }),
    badge: blockType("Small status chip", { text: str, tone: { type: "string", enum: ["neutral", "success", "warning", "danger"] } }),
    callout: blockType("Highlighted note", { text: str, tone: { type: "string", enum: ["info", "warning", "success"] } }),
    divider: blockType("Horizontal separator"),
    input_text: inputType("Single-line answer"),
    input_email: inputType("Email address"),
    input_phone_number: inputType("Phone number"),
    input_number: inputType("Numeric answer", "number"),
    input_date: inputType("Date picker"),
    input_single_select: inputType("Choose one option"),
    button: blockType("Clickable action", { label: str, style: { type: "string", enum: ["primary", "secondary"] }, width: { type: "number" } }, { events: ["press"] }),
  },
};

/** Fresh, stateful routes for one scenario. */
export function makeEditorBRoutes() {
  const store: Record<string, any> = { [PR_ID]: paymentReminder(), [SL_ID]: supportLine() };
  const numbers = [
    number("num_1209", "+919876541209", "plivo", "tel_ringg", null),
    number("num_1210", "+919876541210", "plivo", "tel_ringg", null),
    number("num_1204", "+919876541204", "exotel", "tel_exotel_mumbai", null, true, "customer"),
    number("num_1211", "+919876541211", "plivo", "tel_ringg", { id: "agt_lead_callback", agent_display_name: "Lead qualification" }),
    number("num_1201", "+919876541201", "plivo", "tel_ringg", null, false),
    { ...number("num_test", "+919876540000", "plivo", "tel_ringg", null, false), is_test_number: true },
  ];
  let seq = 0;
  const ver = (agentId: string) => {
    const a = store[agentId] ?? store[PR_ID];
    return a.version_details[a.active_agent_version_id];
  };
  const phaseKey: Record<string, string> = { edit_pre_call_tools: "pre_call_tools", edit_on_call_tools: "on_call_tools", edit_post_call_tools: "post_call_tools" };
  const EMBEDDED = new Set(["BLOCKS_WIDGET_TOOL", "WIDGET_TOOL", "FORM_WIDGET_TOOL", "BUTTONS_WIDGET_TOOL", "QUICK_REPLY_TOOL", "EXECUTE_DOM_ACTION_TOOL"]);

  function applyPatch(b: any) {
    const agentId = b?.agent_id ?? PR_ID;
    const agent = store[agentId];
    if (!agent) return;
    const vd = ver(agentId);
    switch (b.operation) {
      case "edit_call_config": vd.call_config = { ...vd.call_config, ...b.call_config }; break;
      case "edit_vad_settings": vd.agent_config.interruption_sensitivity = b.vad_settings?.interruption_sensitivity ?? null; break;
      case "edit_noise_settings":
        if (b.mute_while_bot_speaking !== undefined) vd.agent_config.mute_while_bot_speaking = b.mute_while_bot_speaking;
        if (b.mute_during_intro !== undefined) vd.agent_config.mute_during_intro = b.mute_during_intro;
        break;
      case "edit_rate_limit": vd.agent_config.rate_limit = b.rate_limit; break;
      case "edit_client_analysis": vd.client_analysis = { ...(vd.client_analysis ?? {}), ...b.client_analysis }; break;
      case "edit_analytics_context": vd.analytics_context = b.analytics_context; break;
      case "edit_event_subscriptions":
        // The backend masks secret header values on read, e.g. "Bear***".
        vd.event_subscriptions = (b.event_subscriptions ?? []).map((sub: any) => ({
          ...sub,
          headers: Object.fromEntries(Object.entries(sub.headers ?? {}).map(([k, val]) => [k, /auth|token|key|secret/i.test(k) && typeof val === "string" && !val.endsWith("***") ? `${val.slice(0, 4)}***` : val])),
        }));
        break;
      case "edit_agent_whitelisted_domains": vd.whitelisted_domains = (b.whitelisted_domains ?? []).map((d: string) => (/^[a-z]+:\/\//i.test(d) ? d : `https://${d}`).toLowerCase()); break;
      case "attach_inbound_number":
        agent.inbound_number_id = b.number_id;
        for (const n of numbers) if (n.id === b.number_id) n.agent = { id: agentId, agent_display_name: agent.agent_display_name };
        break;
      case "remove_inbound_number":
        agent.inbound_number_id = "";
        for (const n of numbers) if (n.id === b.number_id) n.agent = null;
        break;
      case "edit_on_call_tool": {
        // Components (blocks widgets) are saved one at a time.
        const t = b.on_call_tool ?? {};
        const list = vd.embedded_on_call_tools ?? [];
        const i = list.findIndex((x: any) => (t.tool_id && x.tool_id === t.tool_id) || x.tool_name === t.tool_name);
        vd.embedded_on_call_tools = i >= 0 ? list.map((x: any, j: number) => (j === i ? { ...x, ...t } : x)) : [...list, { tool_id: `wt_new_${++seq}`, ...t }];
        break;
      }
      case "edit_pre_call_tools":
      case "edit_on_call_tools":
      case "edit_post_call_tools": {
        const tools = (b.tools ?? []).map((t: any) => ({ ...t, tool_id: t.tool_id ?? `tl_new_${++seq}` }));
        const type = b.tool_type ?? tools[0]?.tool_type;
        const key = EMBEDDED.has(type) ? "embedded_on_call_tools" : phaseKey[b.operation];
        if (EMBEDDED.has(type) && tools.length === 1) {
          // Embedded widgets are saved one at a time.
          const list = vd[key] ?? [];
          const i = list.findIndex((t: any) => t.tool_id === tools[0].tool_id || t.tool_name === tools[0].tool_name);
          vd[key] = i >= 0 ? list.map((t: any, j: number) => (j === i ? { ...t, ...tools[0] } : t)) : [...list, { ...tools[0], tool_type: type }];
        } else {
          vd[key] = [...(vd[key] ?? []).filter((t: any) => t.tool_type !== type), ...tools.map((t: any) => ({ ...t, tool_type: t.tool_type ?? type }))];
        }
        break;
      }
    }
    vd.updated_at = new Date().toISOString();
  }

  const toolFields = (url: URL) => {
    const phase = url.searchParams.get("phase");
    const agentId = url.pathname.split("/").pop()!;
    const vd = ver(agentId);
    const custom_args = (vd.agent_config.custom_variables as string[]).map((key) => ({ key, type: "variable", description: `Custom variable ${key}` }));
    const call_data = ["id", "to_number", "from_number", "call_duration", "status", "transcript", "recording_url"].map((key) => ({ key, type: "variable" }));
    const out: Record<string, unknown> = { custom_args, call_data, tool_output: { check_payment_status: [{ key: "paid", type: "variable" }, { key: "paid_on", type: "variable" }, { key: "amount_due", type: "variable" }] } };
    if (phase === "post_call") {
      out.platform_analysis = ["summary", "classification", "callback_requested", "key_points"].map((key) => ({ key, type: "variable" }));
      out.client_analysis = Object.keys(vd.client_analysis?.keys ?? {}).map((key) => ({ key, type: "variable" }));
    }
    return out;
  };

  const crmResponse = {
    customer: { name: "Rahul Verma", mobile: "+919876543210", segment: "salaried", relationship_manager: { name: "Neha Kapoor", phone: "+919876540201" } },
    loan: { id: "AL-20931", emi_amount: 12450, due_date: "2026-10-05", outstanding: 284300, last_payment_on: "2026-09-05" },
  };

  return {
    ...agentRoutes,
    "GET /agent/all": { status: "success", data: { agents: listAgents } },
    "GET /agent/*": (url: URL) => ({ agents: store[url.pathname.split("/").pop()!] ?? store[PR_ID] }),
    "GET /agent/*/multiprompt-eligibility": { agent_prompt_tokens: 420, can_convert_to_multiprompt: false, threshold: 4000 },
    "PATCH /agent/v1": (_u: URL, b: any) => {
      applyPatch(b);
      return { message: "Agent updated successfully", agent_id: b?.agent_id ?? PR_ID, version_id: b?.version_id ?? V_PR };
    },
    "GET /kb/all": [],
    "GET /workspace/call-frequency-cap/agent/*": (url: URL) => ({ status: "success", agent_id: url.pathname.split("/").pop(), enabled: true, max_calls: 3, window_minutes: 1440, workspace: { enabled: true, max_calls: 10, window_minutes: 1440 } }),
    "PATCH /workspace/call-frequency-cap/agent/*": (url: URL, b: any) => ({ status: "success", agent_id: url.pathname.split("/").pop(), enabled: b?.enabled ?? true, max_calls: b?.max_calls ?? 3, window_minutes: 1440, workspace: { enabled: true, max_calls: 10, window_minutes: 1440 } }),

    // Tools
    "GET /agent/api-tool-fields/*": toolFields,
    "GET /integrations/catalog": [],
    "GET /integrations/tools/all": [],
    "GET /workspace-tools": [
      workspaceTool("wst_loan_details", "fetch_loan_details", "Fetches EMI, due date and outstanding amount for a loan.", ["pre_call", "on_call"], "GET", "https://api.acme-lending.example/v1/loans/{loan_id}", 4),
      workspaceTool("wst_payment_link", "send_payment_link", "Sends a UPI payment link to the customer by SMS.", ["on_call", "post_call"], "POST", "https://api.acme-lending.example/v1/payment-links", 2),
    ],
    "POST /tools/run": { status_code: 200, response: crmResponse, duration_ms: 182 },
    "POST /tools/v1/run": { success: true, status_code: 200, response: crmResponse, duration_ms: 182, request_body: {}, message: "OK" },

    "GET /tools/v1/blocks-catalog": blocksCatalog,
    "POST /tools/v1/validate": { valid: true, errors: [] },
    // AI builder turn: adds a date picker above the form's submit button.
    "POST /tools/v1/blocks-assist": (_u: URL, b: any) => {
      const config = structuredClone(b?.config ?? {});
      const addToForm = (nodes: any[] = []): boolean => nodes.some((n) => {
        if (n.type === "form" && Array.isArray(n.children)) {
          const at = Math.max(0, n.children.findIndex((c: any) => c.type === "button"));
          n.children.splice(at, 0, { type: "input_date", name: "callback_date", props: { label: "Preferred callback date" } });
          return true;
        }
        return addToForm(n.children);
      });
      addToForm(config.blocks);
      return { config, issues: [], say: "Added a Preferred callback date picker above Submit.", applied: true, history: null };
    },

    // Advanced Analysis test
    "GET /calling/history/v2": (url: URL) => {
      const id = url.searchParams.get("call_id");
      const calls = id ? recentCalls.filter((c) => c.id === id) : recentCalls;
      return { limit: 10, count: calls.length, total: calls.length, offset: 0, calls };
    },
    "GET /agent/run_analysis/*": (url: URL) => {
      const vd = ver(url.pathname.split("/").pop()!);
      const sample: Record<string, unknown> = { promised_date: "2026-10-08", objection: "none", payment_promised: true, amount_promised: 12450 };
      const analysis_result = Object.fromEntries(Object.keys(vd.client_analysis?.keys ?? {}).map((k) => [k, sample[k] ?? null]));
      return { call_id: url.searchParams.get("call_id") ?? "call_8f2a61d0", agent_name: "Payment reminder", callee_name: "Rahul Verma", transcript: JSON.stringify(transcript), analysis_result, created_at: recentCalls[0].created_at, message: "Analysis completed" };
    },

    // Attach number
    // Telephony filter: no account id means Ringg's own numbers.
    "GET /workspace/numbers": (url: URL) => ({ workspace_numbers: numbers.filter((n) => n.telephony_id === (url.searchParams.get("telephony_account_id") || "tel_ringg")) }),
    "GET /telephony/accounts": { accounts: [{ id: "tel_exotel_mumbai", provider: "exotel", created_at: "2026-07-14T09:20:00Z", owner: "customer", name: "Exotel Mumbai", is_custom_number_enabled: false, is_custom_telephony: false }], total: 1 },
  } as Record<string, unknown>;
}

/** Screenshot without toasts in front (HeroUI toasts are not covered by lib.ts cleanPage). */
export async function shotNoToasts(s: { page: import("@playwright/test").Page; shot: (name: string, target?: import("@playwright/test").Locator, padding?: number) => Promise<void> }, name: string, target?: import("@playwright/test").Locator, padding?: number) {
  const tag = await s.page.addStyleTag({ content: `[role="region"][aria-label*="otification" i], [data-toast], li[role="alertdialog"], [data-slot="toast"] { visibility: hidden !important; }` });
  await s.page.waitForTimeout(100);
  await s.shot(name, target, padding);
  await tag.evaluate((el) => el.remove());
}
