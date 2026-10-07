// Single-prompt editor fixture (part 1): outbound agent "Payment reminder" for Acme Lending.
// Shapes follow the production source: AgentInfoResponse / AgentVersionDetails (types/agent.types.ts),
// VoiceListItem (types/voice.types.ts), KnowledgeBaseItem (lib/api/knowledgeBase.api.ts).
import { NOW } from "./common.ts";
import { agentRoutes, agents } from "./agents.ts";

// The dashboard breadcrumb only resolves UUID ids, so the editor uses a UUID for agt_payment_reminder.
export const AGENT_ID = "8c1f2a4e-5b7d-4e2a-9c3f-1a2b3c4d5e6f";
const V1 = "ver_pr_v1";
const V2 = "ver_pr_v2";

export const PREVIEW_HOST = "https://voices.ringg.example";
const SPEEDS = ["0.7", "0.8", "0.9", "1.0", "1.1", "1.2"];
/** voice_previews keys are speeds per language: { "1.0": url, ... }. */
const preview = (n: number) => Object.fromEntries(SPEEDS.map((sp) => [sp, `${PREVIEW_HOST}/preview-${n}-${sp}.mp3`]));

export const voices = [
  { id: "voc_ananya", name: "Ananya", languages: ["en-IN", "hi-IN"], voice_previews: { "en-IN": preview(1), "hi-IN": preview(2) }, image_url: "", gender: "female", tag: "Warm", sub_tags: ["Conversational", "Customer care"], tts_provider: "elevenlabs", user_uploaded_voice: false },
  { id: "voc_rohan", name: "Rohan", languages: ["en-IN", "hi-IN"], voice_previews: { "en-IN": preview(3), "hi-IN": preview(4) }, image_url: "", gender: "male", tag: "Calm", sub_tags: ["Professional"], tts_provider: "cartesia", user_uploaded_voice: false },
  { id: "voc_meera", name: "Meera", languages: ["en-IN", "hi-IN"], voice_previews: { "en-IN": preview(5), "hi-IN": preview(6) }, image_url: "", gender: "female", tag: "Friendly", sub_tags: ["Sales", "Upbeat"], tts_provider: "sarvam", user_uploaded_voice: false },
  { id: "voc_arjun", name: "Arjun", languages: ["en-IN", "hi-IN"], voice_previews: { "en-IN": preview(7), "hi-IN": preview(8) }, image_url: "", gender: "male", tag: "Confident", sub_tags: ["Collections"], tts_provider: "elevenlabs", user_uploaded_voice: false },
  { id: "voc_kavya", name: "Kavya", languages: ["en-IN", "hi-IN"], voice_previews: { "en-IN": preview(9), "hi-IN": preview(10) }, image_url: "", gender: "female", tag: "Clear", sub_tags: ["Narration"], tts_provider: "sarvam", user_uploaded_voice: false },
  { id: "voc_isha", name: "Isha", languages: ["en-IN", "hi-IN"], voice_previews: { "en-IN": preview(13), "hi-IN": preview(14) }, image_url: "", gender: "female", tag: "Warm", sub_tags: ["Support"], tts_provider: "cartesia", user_uploaded_voice: false },
  { id: "voc_kabir", name: "Kabir", languages: ["en-IN", "hi-IN"], voice_previews: { "en-IN": preview(15), "hi-IN": preview(16) }, image_url: "", gender: "male", tag: "Friendly", sub_tags: ["Sales"], tts_provider: "sarvam", user_uploaded_voice: false },
  { id: "voc_vikram", name: "Vikram", languages: ["en-IN", "hi-IN"], voice_previews: { "en-IN": preview(11), "hi-IN": preview(12) }, image_url: "", gender: "male", tag: "Deep", sub_tags: ["Formal"], tts_provider: "cartesia", user_uploaded_voice: false },
];

export const voiceConfigs = [
  { label: "English (India)", value: "en-IN", secondary_supported_lang: ["hi-IN"] },
  { label: "Hindi", value: "hi-IN", secondary_supported_lang: ["en-IN"] },
  { label: "Marathi", value: "mr-IN", secondary_supported_lang: ["en-IN", "hi-IN"] },
  { label: "Tamil", value: "ta-IN", secondary_supported_lang: ["en-IN"] },
  { label: "Telugu", value: "te-IN", secondary_supported_lang: ["en-IN"] },
  { label: "Bengali", value: "bn-IN", secondary_supported_lang: ["en-IN"] },
];

export const knowledgeBases = [
  { kb_id: "kb_emi_faq", kb_name: "EMI payment FAQ", status: "completed", type: "file", created_at: "2026-08-12T09:00:00Z", updated_at: "2026-09-20T09:00:00Z" },
  { kb_id: "kb_loan_policy", kb_name: "Loan policy 2026", status: "completed", type: "file", created_at: "2026-07-02T09:00:00Z", updated_at: "2026-09-02T09:00:00Z" },
  { kb_id: "kb_branches", kb_name: "Branch locations", status: "completed", type: "url", created_at: "2026-06-20T09:00:00Z", updated_at: "2026-08-15T09:00:00Z" },
];

export const promptSections = [
  {
    section_title: "Persona",
    section_content: "You are Ananya, a polite payment reminder assistant calling on behalf of Acme Lending. You speak clearly, keep sentences short and never pressure the customer.",
  },
  {
    section_title: "Goal",
    section_content: "Remind @{{callee_name}} that their loan EMI of ₹@{{due_amount}} is due on @{{due_date}}, and get a clear commitment on when they will pay.",
  },
  {
    section_title: "Conversation flow",
    section_content:
      "1. Confirm you are speaking with @{{callee_name}}.\n2. State the EMI amount and due date.\n3. Ask when they plan to pay. If they have already paid, thank them and note it.\n4. If they ask how to pay, explain UPI, net banking or the Acme Lending app.\n5. Close politely.",
  },
  {
    section_title: "Rules",
    section_content: "Never ask for card numbers, OTPs or passwords. If the customer asks to speak to a person, offer a callback from the collections team. Answer policy questions only from the knowledge base.",
  },
];

const callConfig = {
  call_time: { call_start_time: "09:00", call_end_time: "19:00", timezone: "Asia/Kolkata" },
  voicemail: { detect: true, action: "hangup", retry: true },
  max_call_length: 300,
  idle_timeout_end: 20,
  idle_timeout_warning: 10,
  noise_filter_config: { filter_noise: true },
};

/** Optional tools (EditorAOptions.tools): one pre-call and one on-call API tool, so the @ menu lists both groups. */
const apiTool = (id: string, name: string, phase: string, description: string, url: string, keys: string[]) => ({
  tool_id: id, tool_name: name, name, description, tool_type: "API_TOOL", tool_phase: phase, is_enabled: true, execution_order: 0,
  config: { url, method: "GET", headers: [], path: [], query: [], body: [], timeout_ms: 5000, response_selected_keys: keys },
});
const preCallTools = [apiTool("tl_get_loan", "get_loan_account", "pre_call", "Fetches the loan account before the call.", "https://api.acme-lending.example/v1/loans/lookup", ["emi_amount", "outstanding", "last_payment_date"])];
const onCallTools = [apiTool("tl_check_payment", "check_payment_status", "on_call", "Checks whether this month's EMI has already been paid.", "https://api.acme-lending.example/v1/payments/status", ["paid", "paid_on"])];

type Voice = (typeof voices)[number];
type VersionState = { id: string; slug: string; description: string; traffic: number; voice: Voice; secondaryVoice: Voice | null; language: string; secondaryLanguage: string; voiceSpeed: number; prompt: unknown; intro: string; customVars: string[]; kbIds: string[]; tools: boolean };

const versionDetail = (v: VersionState) => ({
  version_id: v.id,
  version_slug: v.slug,
  description: v.description,
  call_traffic: String(v.traffic),
  whitelisted_domains: [],
  language: v.language,
  voice: { id: v.voice.id, name: v.voice.name, voice_preview: v.voice.voice_previews["en-IN"]["1.0"], image_url: "" },
  secondary_language: v.secondaryLanguage,
  secondary_voice_id: v.secondaryVoice?.id ?? "",
  additional_languages: [],
  agent_config: {
    vocab: ["EMI", "Acme Lending", "UPI"],
    voice_speed: v.voiceSpeed,
    agent_prompt: typeof v.prompt === "string" ? v.prompt : JSON.stringify(v.prompt),
    interruption_sensitivity: "default",
    dtmf_settings: { dtmf_capturing_enabled: false, dtmf_input: { end: "#", reset: "*", digits: 6, timeout: 5 } },
    intro_message: v.intro,
    mute_while_bot_speaking: false,
    mute_during_intro: false,
    custom_variables: v.customVars,
    pre_query_response_phrases: [],
    llm: { provider: "openai", model: "gpt-4.1-mini" },
    is_demo_enabled: false,
    rate_limit: null,
    evals: null,
  },
  tools: [],
  custom_analysis_prompt: { prompt: "", keys: {} },
  client_analysis: null,
  call_config: callConfig,
  knowledge_bases: v.kbIds.map((id) => ({ knowledge_base_id: id, knowledge_base_name: knowledgeBases.find((k) => k.kb_id === id)!.kb_name })),
  event_subscriptions: [],
  post_call_tools: [],
  embedded_on_call_tools: [],
  available_tools: [],
  pre_call_tools: v.tools ? preCallTools : [],
  on_call_tools: v.tools ? onCallTools : [],
  record_locally: false,
  chat_config: null,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: NOW,
});

export interface EditorAOptions {
  /** Start with A/B testing on (two versions, 50/50). */
  abVersions?: boolean;
  /** Knowledge bases attached at start (default: EMI payment FAQ). */
  kbIds?: string[];
  /** Variables at start (default: callee_name, mobile_number, due_amount, due_date). */
  customVars?: string[];
  /** Give the agent a pre-call and an on-call API tool (default: none). */
  tools?: boolean;
}

/** In-memory agent: GET /agent/{id} reflects every PATCH /agent/v1 the editor sends. */
function makeAgent(opts: EditorAOptions) {
  const base: VersionState = {
    id: V1, slug: "v1", description: "Original reminder script", traffic: 1, voice: voices[0], secondaryVoice: voices[0], language: "en-IN", secondaryLanguage: "hi-IN", voiceSpeed: 1,
    prompt: { prompt_sections: promptSections },
    intro: "Hello @{{callee_name}}, this is Ananya calling from Acme Lending about your loan EMI. Is this a good time to talk?",
    customVars: opts.customVars ?? ["callee_name", "mobile_number", "due_amount", "due_date"],
    kbIds: opts.kbIds ?? ["kb_emi_faq"],
    tools: !!opts.tools,
  };
  const st = { abLive: !!opts.abVersions, versions: [base] as VersionState[] };
  if (opts.abVersions) {
    base.traffic = 0.5;
    st.versions.push({ ...base, id: V2, slug: "v2", description: "Shorter intro", traffic: 0.5, voice: voices[1], intro: "Hi @{{callee_name}}, Ananya from Acme Lending. Quick reminder about your EMI." });
  }
  const find = (id?: string) => st.versions.find((v) => v.id === id) ?? st.versions[0];
  const info = () => ({
    agents: {
      id: AGENT_ID,
      agent_display_name: "Payment reminder",
      orchestration_mode: "single_node",
      agent_type: "outbound",
      updated_at: "2026-10-01T09:10:00Z",
      is_ab_live: st.abLive,
      template_icon: "",
      template_type: "outbound",
      ab_versions: Object.fromEntries(st.versions.map((v) => [v.id, { slug: v.slug, description: v.description, call_traffic: v.traffic }])),
      version_details: Object.fromEntries(st.versions.map((v) => [v.id, versionDetail(v)])),
      inbound_number_id: "",
      telephony_id: "",
      webcall_public_key: null,
      active_agent_version_id: V1,
    },
  });
  const patch = (_u: URL, b: any) => {
    const v = find(b?.version_id);
    switch (b?.operation) {
      case "toggle_ab_testing": st.abLive = !!b.ab_enabled; break;
      case "add_new_ab_version": {
        const src = find(b.base_version_id ?? b.version_id);
        const n = st.versions.length + 1;
        st.versions.push({ ...src, id: `ver_pr_v${n}`, slug: `v${n}`, description: "", traffic: 0, customVars: [...src.customVars], kbIds: [...src.kbIds] });
        break;
      }
      case "delete_version": st.versions = st.versions.filter((x) => x.id !== b.version_id); break;
      case "edit_traffic": for (const [id, t] of Object.entries(b.traffic_split ?? {})) find(id).traffic = Number(t); break;
      case "edit_version_description": v.description = b.description ?? ""; break;
      case "edit_prompt": v.prompt = b.agent_prompt; break;
      case "edit_intro_message": v.intro = b.intro_message ?? v.intro; break;
      case "edit_custom_vars": v.customVars = b.custom_variables ?? v.customVars; break;
      case "attach_kb": if (!v.kbIds.includes(b.kb_id)) v.kbIds.push(b.kb_id); break;
      case "remove_kb": v.kbIds = v.kbIds.filter((k) => k !== b.kb_id); break;
      case "edit_voice": {
        v.voice = voices.find((x) => x.id === b.voice_id) ?? v.voice;
        if (b.language) v.language = b.language;
        if ("secondary_language" in b) v.secondaryLanguage = b.secondary_language ?? "";
        if (b.secondary_voice_id) v.secondaryVoice = voices.find((x) => x.id === b.secondary_voice_id) ?? v.secondaryVoice;
        if (b.voice_speed) v.voiceSpeed = b.voice_speed;
        break;
      }
      case "edit_voice_speed": v.voiceSpeed = b.voice_speed ?? v.voiceSpeed; break;
    }
    return { status: "success", message: "Agent updated successfully!", agent_id: AGENT_ID };
  };
  return { info, patch };
}

const numBase = { created_at: "2026-06-01T09:00:00Z", agent: null, is_inbound_enabled: false, spam_message: "", tags: [], is_custom_number: false, owner: "ringg", telephony_id: "tel_ringg", provider: "plivo", number_pool_id: null, isExpired: false, expiry_date: "2026-11-01T00:00:00Z" };
export const workspaceNumbers = [
  { ...numBase, id: "num_test_in", number: "+919876540000", is_test_number: true },
  { ...numBase, id: "num_test_us", number: "+12025550143", is_test_number: true },
  { ...numBase, id: "num_1201", number: "+919876541201", is_test_number: false, tags: ["collections"] },
  { ...numBase, id: "num_1203", number: "+919876541203", is_test_number: false, agent: { id: "agt_support_line", agent_display_name: "Support line" }, is_inbound_enabled: true },
];

/** Routes for the single-prompt editor on agt_payment_reminder. */
export function editorARoutes(opts: EditorAOptions = {}) {
  const agent = makeAgent(opts);
  return {
    ...agentRoutes,
    "GET /agent/all": { status: "success", data: { agents: agents.map((a) => (a.id === "agt_payment_reminder" ? { ...a, id: AGENT_ID } : a)) } },
    [`GET /agent/${AGENT_ID}/multiprompt-eligibility`]: { agent_prompt_tokens: 412, can_convert_to_multiprompt: false, threshold: 4000 },
    [`GET /agent/${AGENT_ID}`]: () => agent.info(),
    "GET /agent/voices": { voices },
    "GET /v1/voices": { voices },
    "GET /v1/voices/configs": { voice_configs: voiceConfigs },
    "GET /kb/all": knowledgeBases,
    "PATCH /agent/v1": agent.patch,
    "GET /workspace/numbers": { workspace_numbers: workspaceNumbers },
    "POST /calling/outbound/individual": { status: "success", message: "Call initiated", data: { call_id: "call_test_7781", call_direction: "outbound", call_status: "registered", initiated_at: NOW, agent_id: AGENT_ID } },
    "GET /calling/history/v2": { calls: [{ id: "call_test_7781", status: "ongoing" }], total_count: 1 },
  };
}

/** lib.ts cleanPage only hides sonner toasts; this also hides HeroUI v2/v3 toasts so they never cover captions. */
export async function hideToasts(page: { addStyleTag(o: { content: string }): Promise<unknown> }) {
  await page.addStyleTag({ content: `[data-slot="toast-region"], .toast-region, [data-toast-region], [data-toast] { display: none !important; }` }).catch(() => {});
}

/** Serves a short silent clip for every voice preview so Play works without a real audio CDN. */
export async function stubVoicePreviews(page: { route(url: string, handler: (r: any) => unknown): Promise<unknown> }) {
  const { readFileSync } = await import("node:fs");
  const body = readFileSync(new URL("./editor-a-preview.mp3", import.meta.url));
  await page.route(`${PREVIEW_HOST}/**`, (r) => r.fulfill({ status: 200, contentType: "audio/mpeg", body }));
}
