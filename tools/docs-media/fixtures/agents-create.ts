// Create-agent flow: template list, template detail, languages, voices, knowledge bases, the create call and
// just enough of the new agent for the single-prompt editor to load. Fictional data.
import { NOW } from "./common.ts";
import { agentRoutes } from "./agents.ts";

const ICON = (name: string) => `https://assets.desivocal.com/ringg/icons/regular/${name}.svg`;

export const knowledgeBases = [
  { kb_id: "kb_loan_products", kb_name: "Loan products FAQ", status: "completed", type: "file", created_at: "2026-08-12T09:00:00Z", updated_at: NOW },
  { kb_id: "kb_emi_policy", kb_name: "EMI and late fee policy", status: "completed", type: "file", created_at: "2026-08-20T09:00:00Z", updated_at: NOW },
  { kb_id: "kb_website", kb_name: "acme-lending.example website", status: "completed", type: "url", created_at: "2026-09-02T09:00:00Z", updated_at: NOW },
];

/** Calls any agent editor (single or multi-prompt) makes besides the agent itself. */
export const kbRoutes = {
  "GET /kb/all": knowledgeBases,
  "GET /workspace/call-frequency-cap/agent/*": (url: URL) => ({ status: "success", agent_id: url.pathname.split("/").pop(), enabled: false, max_calls: 3, window_minutes: 1440, workspace: { enabled: true, max_calls: 3, window_minutes: 1440 } }),
  "GET /workspace/call-frequency-cap": { status: "success", enabled: true, max_calls: 3, window_minutes: 1440 },
};

// ----- Templates (GET /v1/templates, GET /v1/templates/{id}) -----

const generalFields = [
  { key: "agent_name", type: "text", label: "Agent Name", value: "", required: true },
  { key: "company_details", type: "textarea", label: "Company details", value: "", required: true, placeholder: "What your company does, in a few lines." },
  { key: "call_purpose", type: "textarea", label: "Purpose of the call", value: "", required: true, placeholder: "What the agent should achieve on this call." },
  { key: "additional_instructions", type: "textarea", label: "Additional instructions", value: "", placeholder: "Tone, things to avoid, how to handle objections." },
];

const tpl = (t: Record<string, unknown>) => ({
  template_source: "ringg",
  template_prompt: "",
  recording_url: "",
  form_fields: generalFields,
  custom_variables: ["callee_name", "mobile_number"],
  custom_functions: [],
  primary_language: "en-IN",
  secondary_language: "",
  created_by: "ringg",
  template_orchestration_mode: "single_node",
  ...t,
});

export const templates = [
  // One general single-prompt template per channel (found by industry_type "general" + template_label "general_<type>").
  tpl({ id: "tpl_general_outbound", template_name: "Outbound assistant", template_label: "general_outbound", template_description: "Create an outbound assistant from scratch with your own call context.", template_icon: ICON("phone-outgoing"), template_type: "outbound", industry_type: "general" }),
  tpl({ id: "tpl_general_inbound", template_name: "Inbound assistant", template_label: "general_inbound", template_description: "Create an inbound assistant from scratch that answers your calls.", template_icon: ICON("phone-incoming"), template_type: "inbound", industry_type: "general" }),
  tpl({ id: "tpl_general_webcall", template_name: "Webcall assistant", template_label: "general_webcall", template_description: "Create a voice assistant for your website from scratch.", template_icon: ICON("globe"), template_type: "webcall", industry_type: "general" }),
  tpl({ id: "tpl_general_whatsapp", template_name: "WhatsApp assistant", template_label: "general_whatsapp", template_description: "Create a WhatsApp assistant from scratch.", template_icon: ICON("whatsapp-logo"), template_type: "whatsapp", industry_type: "general" }),
  // Industry templates.
  tpl({ id: "tpl_emi_reminder", template_name: "EMI payment reminder", template_label: "emi_reminder", template_description: "Remind borrowers of an upcoming EMI and capture a promise-to-pay date.", template_icon: ICON("currency-inr"), template_type: "outbound", industry_type: "financial", recording_url: "https://example.invalid/demo.mp3", custom_variables: ["callee_name", "mobile_number", "emi_amount", "due_date"] }),
  tpl({ id: "tpl_loan_lead", template_name: "Loan lead qualification", template_label: "loan_lead", template_description: "Call new loan enquiries, check eligibility basics and book a callback.", template_icon: ICON("bank"), template_type: "outbound", industry_type: "financial" }),
  tpl({ id: "tpl_cod_confirm", template_name: "COD order confirmation", template_label: "cod_confirm", template_description: "Confirm cash-on-delivery orders before dispatch to cut returns.", template_icon: ICON("shopping-cart"), template_type: "outbound", industry_type: "ecommerce" }),
  tpl({ id: "tpl_delivery_ndr", template_name: "Failed delivery follow-up", template_label: "delivery_ndr", template_description: "Reach customers after a failed delivery and reschedule the attempt.", template_icon: ICON("truck"), template_type: "outbound", industry_type: "logistics" }),
  tpl({ id: "tpl_appointment", template_name: "Appointment reminder", template_label: "appointment", template_description: "Remind patients of their appointment and confirm or reschedule.", template_icon: ICON("heartbeat"), template_type: "outbound", industry_type: "healthcare" }),
  tpl({ id: "tpl_admissions", template_name: "Admissions counselling", template_label: "admissions", template_description: "Follow up on course enquiries and book a counselling session.", template_icon: ICON("student"), template_type: "outbound", industry_type: "education" }),
  tpl({ id: "tpl_interview", template_name: "Interview scheduling", template_label: "interview", template_description: "Screen applicants with a few questions and schedule interviews.", template_icon: ICON("briefcase"), template_type: "outbound", industry_type: "hr_recruitment" }),
  tpl({ id: "tpl_support_desk", template_name: "Loan servicing helpdesk", template_label: "support_desk", template_description: "Answer questions on balance, EMI dates and statements.", template_icon: ICON("chat-circle-text"), template_type: "inbound", industry_type: "financial" }),
  tpl({ id: "tpl_order_status", template_name: "Order status line", template_label: "order_status", template_description: "Tell callers where their order is and log delivery complaints.", template_icon: ICON("package"), template_type: "inbound", industry_type: "ecommerce" }),
];

// ----- Languages and voices (GET /v1/voices/configs, GET /v1/voices) -----

export const voiceConfigs = [
  { label: "English (India)", value: "en-IN", secondary_supported_lang: ["hi-IN", "ta-IN", "mr-IN"] },
  { label: "Hindi", value: "hi-IN", secondary_supported_lang: ["en-IN"] },
  { label: "Tamil", value: "ta-IN", secondary_supported_lang: ["en-IN"] },
  { label: "Marathi", value: "mr-IN", secondary_supported_lang: ["en-IN"] },
  { label: "English (US)", value: "en-US", secondary_supported_lang: [] },
];

const AVATAR = (n: string) => `https://assets.ringg.ai/images/avatars/${n}.svg`;
const voice = (id: string, name: string, gender: string, tts_provider: string, tag: string, avatar: string) => ({
  id, name, gender, tts_provider, tag, sub_tags: [], languages: ["en-IN", "hi-IN"], voice_previews: {}, image_url: AVATAR(avatar), user_uploaded_voice: false,
});
export const voices = [
  voice("voice_ananya", "Ananya", "female", "elevenlabs", "Warm, Most used", "female_2"),
  voice("voice_arjun", "Arjun", "male", "elevenlabs", "Confident", "male_4"),
  voice("voice_meera", "Meera", "female", "cartesia", "Calm", "female_1"),
  voice("voice_kabir", "Kabir", "male", "cartesia", "Friendly", "male_1"),
  voice("voice_diya", "Diya", "female", "sarvam", "Expressive", "female_3"),
  voice("voice_rohan", "Rohan", "male", "sarvam", "Neutral", "male_2"),
];

// ----- The created agent: just enough for the single-prompt editor -----

export const NEW_AGENT_ID = "8a2e4c6d-1f3b-4d5e-9a7c-2b4d6f8a0c1e";
const NEW_VERSION_ID = "4c6e8a0b-2d4f-4a6c-8e0a-1b3d5f7a9c2e";

const newAgentPrompt = [
  { section_title: "Objective", section_content: "You are Ananya, a polite collections assistant for Acme Lending. Remind {{callee_name}} of their EMI of ₹{{emi_amount}} due on {{due_date}} and confirm when they will pay." },
  { section_title: "Conversation Script", section_content: "1. Confirm you are speaking to {{callee_name}}.\n2. State the EMI amount and due date.\n3. Ask when they will pay and repeat the date back.\n4. Thank them and end the call." },
  { section_title: "Response Guidelines", section_content: "Be brief and respectful. Never threaten. If the customer disputes the amount, offer a callback from the loans team." },
];

export const newAgent = {
  id: NEW_AGENT_ID,
  agent_display_name: "EMI reminder",
  orchestration_mode: "single_node",
  agent_type: "outbound",
  updated_at: new Date().toISOString(),
  is_ab_live: false,
  template_icon: ICON("phone-outgoing"),
  template_type: "outbound",
  ab_versions: { [NEW_VERSION_ID]: { slug: "v1", call_traffic: 100 } },
  inbound_number_id: "",
  telephony_id: "",
  webcall_public_key: null,
  active_agent_version_id: NEW_VERSION_ID,
  version_details: {
    [NEW_VERSION_ID]: {
      version_id: NEW_VERSION_ID,
      version_slug: "v1",
      description: "",
      call_traffic: "100",
      whitelisted_domains: [],
      language: "en-IN",
      voice: { id: "voice_ananya", name: "Ananya", voice_preview: "", image_url: AVATAR("female_2") },
      secondary_language: "hi-IN",
      secondary_voice_id: "",
      additional_languages: [],
      agent_config: {
        vocab: [],
        voice_speed: 1,
        agent_prompt: newAgentPrompt,
        interruption_sensitivity: null,
        dtmf_settings: null,
        intro_message: "Namaste {{callee_name}}, this is Ananya from Acme Lending. Is this a good time to talk about your EMI?",
        mute_while_bot_speaking: false,
        mute_during_intro: false,
        custom_variables: ["callee_name", "mobile_number", "emi_amount", "due_date"],
        pre_query_response_phrases: [],
        llm: { provider: "openai", model: "gpt-4.1" },
        is_demo_enabled: false,
        rate_limit: null,
        evals: null,
      },
      tools: [],
      custom_analysis_prompt: null,
      client_analysis: null,
      call_config: { max_call_length: 600, idle_timeout_warning: 10, idle_timeout_end: 20, voicemail: { detect: true, action: "hangup", retry: false } },
      knowledge_bases: [{ knowledge_base_id: "kb_emi_policy", knowledge_base_name: "EMI and late fee policy" }],
      event_subscriptions: [],
      post_call_tools: [],
      embedded_on_call_tools: [],
      available_tools: [],
      pre_call_tools: [],
      on_call_tools: [],
      record_locally: false,
      chat_config: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
};

export const agentsCreateRoutes = {
  ...agentRoutes,
  ...kbRoutes,
  "GET /v1/templates": { templates },
  "GET /v1/templates/*": (url: URL) => ({ template: templates.find((t) => t.id === url.pathname.split("/").pop()) ?? templates[0] }),
  "GET /v1/voices/configs": { voice_configs: voiceConfigs },
  "GET /v1/voices": { voices },
  // Held for a few seconds so the "creating your assistant" progress screen is visible.
  "POST /v1/agent": async () => {
    await new Promise((r) => setTimeout(r, 4500));
    return { message: "Agent created successfully", agent_id: NEW_AGENT_ID, agent_prompt: JSON.stringify(newAgentPrompt) };
  },
  [`GET /agent/${NEW_AGENT_ID}`]: { agents: newAgent },
  [`GET /agent/${NEW_AGENT_ID}/multiprompt-eligibility`]: { agent_prompt_tokens: 410, can_convert_to_multiprompt: false, threshold: 2000 },
};
