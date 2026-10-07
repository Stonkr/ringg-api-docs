// Multi-prompt agent "Loan application flow" (agt_loan_flow) on the canvas. Fictional data.
import { NOW } from "./common.ts";
import { agentRoutes, agents } from "./agents.ts";
import { kbRoutes, voiceConfigs, voices } from "./agents-create.ts";

// The topbar only names agents whose id is a UUID, so agt_loan_flow is served under this id.
export const LOAN_FLOW_ID = "6f1c2a3b-8d4e-4f5a-9b6c-7d8e9f0a1b2c";
const AGENT_ID = LOAN_FLOW_ID;
const VERSION_ID = "ver_loan_flow_v1";

const N = {
  start: "0b6f2c1e-1111-4a8e-9c1a-000000000001",
  agent: "3c2d9f4a-2222-4b1e-8d2a-000000000002",
  router: "5e8a1b7c-3333-4c2f-9e3b-000000000003",
  collect: "7a4c3d2e-4444-4d3a-8f4c-000000000004",
  action: "9b5d4e3f-5555-4e4b-9a5d-000000000005",
  logic: "4e9f8a7b-8888-4b7c-8d9e-000000000008",
  speak: "1c6e5f4a-6666-4f5c-8b6e-000000000006",
  keypad: "6a1b2c3d-9999-4c8d-9e0f-000000000009",
  callback: "8d2e3f4a-aaaa-4d9e-8f1a-00000000000a",
  end: "2d7f6a5b-7777-4a6d-9c7f-000000000007",
};
// Agent-node avatar: a stock Ringg avatar (the panel only shows http URLs).
const AVATAR = "https://assets.ringg.ai/images/avatars/female_2.svg";
const BR = { apply: "br_wants_to_apply", no: "br_not_interested", eligible: "cond_eligible", key1: "key_callback", key2: "key_finish" };
const API = "https://api.acme-lending.example/v1";
const param = (key: string, value: string, type = "variable") => ({ key, value, type });

const nodes = [
  { id: N.start, type: "start_node", position: { x: 0, y: 40 }, label: "Start" },
  { id: N.agent, type: "agent_node", position: { x: 130, y: 0 }, label: "Greet and confirm identity", name: "greet_and_confirm", description: "Greets the caller, confirms their name and asks about the loan enquiry.", avatar_url: AVATAR, knowledge_base_count: 1, on_call_tools_count: 0, end_call_enabled: true },
  { id: N.router, type: "router_node", position: { x: 450, y: 10 }, label: "Interested?", name: "interested_router", node_config: { mode: "llm", branches: [{ id: BR.apply, description: "Wants to apply for the loan", next: N.collect }, { id: BR.no, description: "Not interested right now", next: N.end }], max_attempts: 2, extract: { loan_amount: { type: "number", description: "Loan amount the caller wants, in rupees", required: false }, employment_type: { type: "enum", values: ["salaried", "self_employed"], description: "How the caller earns", required: false } } } },
  { id: N.collect, type: "collect_node", position: { x: 770, y: -20 }, label: "Collect PIN code", name: "collect_pin", node_config: { collect_type: "pin", store_variable: "collect_pin", num_digits: 6, max_attempts: 3, allow_keypad: true, reask_prompt: "Please say or key in your six-digit PIN code.", failure_next: N.end } },
  { id: N.action, type: "action_node", position: { x: 130, y: 300 }, label: "Check eligibility", name: "check_eligibility", node_config: { action_type: "webhook", webhook: { url: `${API}/eligibility`, method: "POST", headers: [param("Authorization", "Bearer acme_live_****", "static")], query: [], path: [], body: [param("pincode", "{{collect_pin}}"), param("mobile", "{{mobile_number}}"), param("loan_amount", "{{loan_amount}}")], body_content_type: "json", response_selected_keys: ["eligible", "eligible_amount", "interest_rate"], timeout_ms: 5000 }, store_response: { eligible: "eligible", eligible_amount: "eligible_amount", interest_rate: "interest_rate" }, on_running_say: { en: "One moment while I check your eligibility." }, retries: 1, failure_next: N.end } },
  { id: N.logic, type: "router_node", position: { x: 450, y: 310 }, label: "Eligible?", name: "eligible_router", node_config: { mode: "condition", conditions: [{ id: BR.eligible, description: "Eligible for a loan", conjunction: "and", rules: [{ variable: "eligible", operator: "equals", value: "true" }, { variable: "eligible_amount", operator: "greater_than", value: "50000" }], next: N.speak }], default_next: N.end } },
  { id: N.speak, type: "speak_node", position: { x: 770, y: 300 }, label: "Confirm offer", name: "confirm_offer", node_config: { text: { en: ["Good news! You are eligible for a loan of up to {{eligible_amount}} rupees.", "Great news: you qualify for up to {{eligible_amount}} rupees."], hi: ["खुशखबरी! आप {{eligible_amount}} रुपये तक के लोन के लिए पात्र हैं।"] }, interruptible: false } },
  { id: N.keypad, type: "keypad_menu_node", position: { x: 130, y: 580 }, label: "Advisor callback?", name: "advisor_menu", node_config: { store_variable: "advisor_menu", branches: [{ id: BR.key1, digit: "1" }, { id: BR.key2, digit: "2" }], dtmf: { timeout: 5, digits: 1, end: "#", reset: "*" }, reprompt: "Press 1 for a callback from an advisor, or 2 to finish.", max_attempts: 3, exhausted_next: N.end } },
  { id: N.callback, type: "action_node", position: { x: 450, y: 570 }, label: "Book advisor callback", name: "book_callback", node_config: { action_type: "webhook", webhook: { url: `${API}/callbacks`, method: "POST", headers: [], query: [], path: [], body: [param("mobile", "{{mobile_number}}"), param("amount", "{{eligible_amount}}")], body_content_type: "json", timeout_ms: 5000 }, store_response: {}, retries: 0, failure_next: N.end } },
  { id: N.end, type: "end_node", position: { x: 1100, y: 330 }, label: "End" },
];

const edge = (id: string, source: string, target: string, branch?: string) => ({ id, source, target, condition: null, transition_message: null, transition_config: branch ? { branch_id: branch } : null });
const edges = [
  edge("e1", N.start, N.agent),
  edge("e2", N.agent, N.router),
  edge("e3", N.router, N.collect, BR.apply),
  edge("e4", N.router, N.end, BR.no),
  edge("e5", N.collect, N.action),
  edge("e6", N.action, N.logic),
  edge("e7", N.logic, N.speak, BR.eligible),
  edge("e8", N.speak, N.keypad),
  edge("e9", N.keypad, N.callback, BR.key1),
  edge("e10", N.keypad, N.end, BR.key2),
  edge("e11", N.callback, N.end),
];

export const loanFlowStructure = {
  agent_id: AGENT_ID,
  version_id: VERSION_ID,
  version_slug: "v1",
  agent_display_name: "Loan application flow",
  agent_type: "outbound",
  agent_provider: "ringg",
  orchestration_mode: "multi_node",
  flow_engine_version: 2,
  description: "",
  is_draft: false,
  draft_id: null,
  is_ab_live: false,
  agent_prompt: "",
  language: "en-IN",
  voice_id: "voice_ananya",
  voice_name: "Ananya",
  voice_speed: 1,
  voice_avatar: { image_url: "", gender: "female" },
  secondary_language: "hi-IN",
  secondary_voice_id: null,
  knowledge_base_ids: ["kb_loan_products"],
  knowledge_bases: [{ id: "kb_loan_products", name: "Loan products FAQ" }],
  whitelisted_domains: [],
  custom_variables: ["callee_name", "mobile_number", "loan_type"],
  keyword_boosting: ["EMI", "PIN code"],
  event_subscriptions: [],
  nodes,
  edges,
  tools: [],
  pre_call_tools: [],
  on_call_tools: [],
  post_call_tools: [],
  embedded_on_call_tools: [],
  intro_message: "",
  chat_config: { max_call_length: 900, idle_timeout_warning: 60, idle_timeout_end: 120 },
  call_config: { max_call_length: 600, idle_timeout_warning: 10, idle_timeout_end: 20, mute_during_intro: false, mute_while_bot_speaking: false, voicemail: { detect: true, action: "hangup", retry: false } },
  inbound_number_id: null,
  telephony_id: null,
  created_at: "2026-07-10T10:00:00Z",
  updated_at: NOW,
};

const agentNodeData = {
  id: N.agent,
  type: "agent_node",
  position: { x: 140, y: -40 },
  name: "greet_and_confirm",
  role_messages: [{ role: "system", prompt_sections: [
    { section_id: "introduction_and_objective", section_title: "Objective", section_content: "You are Ananya, a friendly loan advisor at Acme Lending. Confirm you are speaking to {{callee_name}} and find out whether they want to apply for the {{loan_type}} they enquired about." },
    { section_id: "response_guidelines", section_title: "Response Guidelines", section_content: "Keep replies short. Match the caller's language (English or Hindi). Never quote interest rates; say the team will share them." },
  ] }],
  task_messages: [{ role: "system", prompt_sections: [
    { section_id: "task", section_title: "Conversation flow", section_content: "1. Confirm the caller's name.\n2. Remind them of their {{loan_type}} enquiry.\n3. Ask if they would like to start the application now." },
    { section_id: "faq_guidelines", section_title: "FAQs", section_content: "Q: How long does approval take?\nA: Usually two working days after documents are verified." },
  ] }],
  functions: [],
  available_tools: [],
  pre_actions: [],
  post_actions: [],
  predefined_tools: [],
  context_strategy: { strategy: "append" },
  respond_immediately: true,
  overrides: {},
  knowledge_base_ids: ["kb_loan_products"],
  intro_message: "Hello {{callee_name}}, this is Ananya from Acme Lending. Is this a good time to talk?",
};

export const multiPromptRoutes = {
  ...agentRoutes,
  ...kbRoutes,
  "GET /agent/all": { status: "success", data: { agents: agents.map((a) => (a.id === "agt_loan_flow" ? { ...a, id: AGENT_ID } : a)) } },
  "GET /agent/all/call_counts": { status: "success", data: { call_counts: { agt_payment_reminder: 1284, agt_support_line: 412, agt_lead_callback: 96, agt_website: 57, agt_whatsapp: 233, [AGENT_ID]: 31 } } },
  [`GET /agent/${AGENT_ID}`]: { agents: { id: AGENT_ID, agent_display_name: "Loan application flow", orchestration_mode: "multi_node", agent_type: "outbound", updated_at: NOW, is_ab_live: false, template_icon: "", template_type: "outbound", ab_versions: { [VERSION_ID]: { slug: "v1", call_traffic: 100 } }, version_details: {}, inbound_number_id: "", telephony_id: "", webcall_public_key: null, active_agent_version_id: VERSION_ID } },
  [`GET /agent/flow/versions/${AGENT_ID}`]: { agent_id: AGENT_ID, agent_display_name: "Loan application flow", versions: [{ version_id: VERSION_ID, version_slug: "v1", description: "", call_traffic: 100, created_at: "2026-07-10T10:00:00Z", updated_at: NOW }], total_versions: 1, is_ab_live: false },
  [`GET /agent/flow/${AGENT_ID}`]: loanFlowStructure,
  // Speak and Agent nodes list languages and voices for their per-node overrides.
  "GET /v1/voices/configs": { voice_configs: voiceConfigs },
  "GET /v1/voices": { voices },
  // The Action node's request editor: variables it can send, and a Test API run.
  "GET /agent/api-tool-fields/*": { custom_args: ["callee_name", "mobile_number", "loan_type"].map((key) => ({ key, type: "variable", description: `Custom variable ${key}` })), call_data: [], tool_output: {} },
  "POST /tools/v1/run": { success: true, status_code: 200, duration_ms: 412, message: "OK", response: { eligible: true, eligible_amount: 350000, interest_rate: 11.5, tenure_months: [12, 24, 36], reference_id: "ELG-48213" }, filtered_jq_response: null },
  "GET /agent/flow/nodes/*": (url: URL) => (url.pathname.endsWith(N.agent) ? agentNodeData : {}),
};
