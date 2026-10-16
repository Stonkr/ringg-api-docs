// WhatsApp agent fixtures for the editor: the existing "WhatsApp concierge" agent, the agent the create flow
// produces, and stateful routes (PATCH agent/v1 writes into an in-memory copy). Voice-agent routes come from
// editor-b (read-only import); WhatsApp Business data from ./whatsapp.ts. Fictional data only.
import { NOW } from "./common.ts";
import { agents } from "./agents.ts";
import { agentsCreateRoutes, kbRoutes, knowledgeBases, templates } from "./agents-create.ts";
import { makeEditorBRoutes, PR_ID } from "./editor-b.ts";
import { WA_ACCOUNT_ID, WHATSAPP_ICON, waNumbers, waWorkspaceNumber, whatsappAccountRoutes, whatsappToolRoutes, whatsappTools } from "./whatsapp.ts";

// The breadcrumb resolves UUID ids only.
export const WA_ID = "a2c4e6f8-1b3d-4e5f-9a7c-8d0e2f4a6b1c"; // WhatsApp concierge (existing)
export const NEW_WA_ID = "d7e9f1a3-5b7c-4d9e-8f1a-3b5c7d9e1f2a"; // EMI assistant (created in the create flow)
const V_WA = "f1a3b5c7-9d1e-4f3a-8b5c-7d9e1f3a5b7c";
const V_NEW = "b5c7d9e1-3f5a-4b7c-9d1e-3f5a7b9c1d3e";

export const NUM_40321 = "num_wa_pn_40321";
export const NUM_40322 = "num_wa_pn_40322";

// The create dialog's WhatsApp tab lists industry templates too; the shared set has none.
const ICON = (name: string) => `https://assets.desivocal.com/ringg/icons/regular/${name}.svg`;
const whatsappTemplate = (id: string, template_name: string, template_label: string, template_description: string, industry_type: string, iconName: string) => ({
  ...templates.find((t) => t.id === "tpl_general_whatsapp")!, id, template_name, template_label, template_description, industry_type, template_icon: ICON(iconName),
});
const allTemplates = [
  ...templates,
  whatsappTemplate("tpl_wa_emi_support", "EMI payment support", "wa_emi_support", "Answer EMI questions on WhatsApp and send a payment link when the customer is ready.", "financial", "currency-inr"),
  whatsappTemplate("tpl_wa_order_status", "Order status chat", "wa_order_status", "Look up an order and keep the customer posted on delivery over WhatsApp.", "ecommerce", "package"),
  whatsappTemplate("tpl_wa_appointment", "Appointment reminders", "wa_appointment", "Confirm, reschedule or cancel appointments in a WhatsApp chat.", "healthcare", "calendar-check"),
];

const sections = (s: [string, string][]) => s.map(([section_title, section_content]) => ({ section_title, section_content }));
const chatTool = (tool_type: string, tool_name: string, display_description: string) => ({
  tool_id: `sys_${tool_name}`, tool_type, tool_name, tool_phase: "on_call", description: display_description, display_description, is_enabled: false, is_default: false, can_disable: true, multi_instance: false, config: {},
});
const availableTools = [chatTool("END_CHAT_TOOL", "end_chat", "Close the chat after a closing message"), chatTool("END_CALL_TOOL", "end_call", "Hang up after a closing line")];

const waVersion = (id: string, o: Record<string, unknown>) => ({
  version_id: id, version_slug: "v1", description: "Live version", call_traffic: "100", whitelisted_domains: [], language: "en-IN",
  voice: { id: "voice_ananya", name: "Ananya", voice_preview: "", image_url: "https://assets.ringg.ai/images/avatars/female_2.svg" }, secondary_language: "hi-IN", secondary_voice_id: "", additional_languages: [],
  tools: [], knowledge_bases: [], knowledge_base_id: null, knowledge_base_name: null, record_locally: false,
  chat_config: { max_call_length: 600, idle_timeout_warning: 60, idle_timeout_end: 120, whatsapp_session: { idle_timeout_minutes: 180, max_duration_minutes: 1440 } },
  custom_analysis_prompt: { prompt: "", keys: {} }, available_tools: availableTools, analytics_context: { client_analytics: { tool_call_logs: false } },
  call_config: { max_call_length: 600, idle_timeout_end: 20, idle_timeout_warning: 10, voicemail: { detect: false, action: "end", retry: false } },
  client_analysis: null, event_subscriptions: [], pre_call_tools: [], on_call_tools: [], post_call_tools: [], embedded_on_call_tools: [], whatsapp_template_tools: [],
  created_at: "2026-09-01T10:00:00Z", updated_at: NOW, ...o,
});

const WA_PROMPT: [string, string][] = [
  ["Role", "You are Neha, the WhatsApp assistant for Acme Lending. You help customers with EMI payments, statements and loan questions."],
  ["Formatting", "Keep replies short: one to three small paragraphs. Use WhatsApp formatting only: *bold*, _italic_, and lines starting with - for lists. No headings, tables or Markdown links; send bare URLs."],
  ["Task", "Greet {{customer_name}} by name if available. Answer from the knowledge base. When the customer wants to pay, send the payment link and confirm it has been sent. When they are done, thank them and end the chat with @||end_chat||."],
];

function whatsappConcierge() {
  const base = agents.find((a) => a.id === "agt_whatsapp")!;
  return {
    ...base, id: WA_ID, template_icon: WHATSAPP_ICON, is_ab_live: false, ab_versions: { [V_WA]: { slug: "v1", description: "Live version", call_traffic: 100 } },
    inbound_number_id: NUM_40321, telephony_id: WA_ACCOUNT_ID, webcall_public_key: null, active_agent_version_id: V_WA,
    version_details: {
      [V_WA]: waVersion(V_WA, {
        agent_config: {
          vocab: [], voice_speed: 1, agent_prompt: { prompt_sections: sections(WA_PROMPT) }, interruption_sensitivity: null, dtmf_settings: null,
          intro_message: "Hi {{customer_name}}, this is Neha from Acme Lending. How can I help you today?", mute_while_bot_speaking: false, mute_during_intro: false,
          custom_variables: ["customer_name", "loan_account", "emi_amount", "due_date"], pre_query_response_phrases: [], llm: { provider: "openai", model: "gpt-4.1" }, is_demo_enabled: false, rate_limit: null,
        },
        knowledge_bases: [{ knowledge_base_id: "kb_emi_policy", knowledge_base_name: "EMI and late fee policy" }],
        client_analysis: { context: "", goal_key: null, keys: { payment_completed: { type: "boolean", description: "Whether the customer confirmed paying during the chat.", default: false }, callback_requested: { type: "boolean", description: "Whether the customer asked for a call back.", default: false } } },
        on_call_tools: [{ ...availableTools[0], tool_id: "tl_end_chat", is_enabled: true, description: "End the chat once the customer's request is handled." }],
      }),
    },
  };
}

function emiAssistant(inboundNumberId: string) {
  return {
    id: NEW_WA_ID, agent_display_name: "EMI assistant", agent_type: "whatsapp", orchestration_mode: "single_node", template_name: "whatsapp", template_label: "WhatsApp", template_type: "whatsapp",
    template_icon: WHATSAPP_ICON, template_source: "ringg", voice_avatar: "", call_frequency_cap: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    is_ab_live: false, ab_versions: { [V_NEW]: { slug: "v1", call_traffic: 100 } }, inbound_number_id: inboundNumberId, telephony_id: inboundNumberId ? WA_ACCOUNT_ID : "", webcall_public_key: null, active_agent_version_id: V_NEW,
    version_details: {
      [V_NEW]: waVersion(V_NEW, {
        description: "",
        agent_config: {
          vocab: [], voice_speed: 1, agent_prompt: { prompt_sections: sections([
            ["Role", "You are Neha, the WhatsApp assistant for Acme Lending. You remind customers about upcoming EMIs and help them pay on time."],
            ["Formatting", "Keep replies short: one to three small paragraphs. Use WhatsApp formatting only: *bold*, _italic_, and lines starting with - for lists. No headings, tables or Markdown links; send bare URLs."],
            ["Task", "Greet {{customer_name}} by name. Remind them that their EMI of ₹{{emi_amount}} is due on {{due_date}}. If they want to pay, send the payment link and confirm it was sent. When they are done, thank them and end the chat with @||end_chat||."],
          ]) },
          interruption_sensitivity: null, dtmf_settings: null, intro_message: "Hi {{customer_name}}, this is Neha from Acme Lending about your upcoming EMI.", mute_while_bot_speaking: false, mute_during_intro: false,
          custom_variables: ["customer_name", "emi_amount", "due_date"], pre_query_response_phrases: [], llm: { provider: "openai", model: "gpt-4.1" }, is_demo_enabled: false, rate_limit: null,
        },
        knowledge_bases: [{ knowledge_base_id: "kb_emi_policy", knowledge_base_name: "EMI and late fee policy" }],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }),
    },
  };
}

/**
 * Fresh, stateful routes for one scenario. Voice agents (PR_ID) and their saves come from editor-b; the two
 * WhatsApp agents live here. Integration tools saved on a voice agent are re-hydrated from the catalog because
 * the dashboard strips them to {tool_id, integration_id, config} on PATCH.
 */
export function makeWhatsappEditorRoutes() {
  const editorB = makeEditorBRoutes() as Record<string, any>;
  const store: Record<string, any> = { [WA_ID]: whatsappConcierge() };
  const numbers = [waWorkspaceNumber(NUM_40321, "+919876540321", { id: WA_ID, agent_display_name: "WhatsApp concierge" }), waWorkspaceNumber(NUM_40322, "+919876540322", null)];
  const listAgents = [...editorB["GET /agent/all"].data.agents.filter((a: any) => a.id !== "agt_whatsapp"), { ...agents.find((a) => a.id === "agt_whatsapp")!, id: WA_ID }];
  let seq = 0;

  const ver = (agentId: string) => store[agentId].version_details[store[agentId].active_agent_version_id];
  const phaseKey: Record<string, string> = { edit_pre_call_tools: "pre_call_tools", edit_on_call_tools: "on_call_tools", edit_post_call_tools: "post_call_tools" };

  const applyWhatsappPatch = (b: any) => {
    const agent = store[b.agent_id];
    const vd = ver(b.agent_id);
    switch (b.operation) {
      case "edit_chat_settings": vd.chat_config = { ...vd.chat_config, ...b.chat_settings }; break;
      case "edit_event_subscriptions": vd.event_subscriptions = b.event_subscriptions ?? []; break;
      case "edit_client_analysis": vd.client_analysis = { ...(vd.client_analysis ?? {}), ...b.client_analysis }; break;
      case "attach_inbound_number":
        agent.inbound_number_id = b.number_id;
        agent.telephony_id = WA_ACCOUNT_ID;
        for (const n of numbers) n.agent = n.id === b.number_id ? { id: b.agent_id, agent_display_name: agent.agent_display_name } : n.agent?.id === b.agent_id ? null : n.agent;
        break;
      case "remove_inbound_number":
        agent.inbound_number_id = "";
        for (const n of numbers) if (n.id === b.number_id) n.agent = null;
        break;
      case "edit_pre_call_tools":
      case "edit_on_call_tools":
      case "edit_post_call_tools": {
        const tools = (b.tools ?? []).map((t: any) => ({ ...t, tool_id: t.tool_id ?? `tl_new_${++seq}` }));
        const type = b.tool_type ?? tools[0]?.tool_type;
        if (type === "SEND_TEMPLATE_TOOL") vd.whatsapp_template_tools = tools;
        else {
          const key = phaseKey[b.operation];
          vd[key] = [...(vd[key] ?? []).filter((t: any) => t.tool_type !== type), ...tools.map((t: any) => ({ ...t, tool_type: t.tool_type ?? type }))];
        }
        break;
      }
    }
    vd.updated_at = new Date().toISOString();
  };

  // Saved integration tools come back stripped; put the catalog definition back so the card renders.
  const hydrateIntegrationTools = (b: any) => {
    if (b?.tool_type !== "INTEGRATION_TOOL" || !Array.isArray(b.tools)) return b;
    const phase = b.operation === "edit_post_call_tools" ? "post_call" : b.operation === "edit_pre_call_tools" ? "pre_call" : "on_call";
    return {
      ...b,
      tools: b.tools.map((t: any) => {
        const def = whatsappTools.find((d) => d.tool_id === t.tool_id);
        return def ? { ...def, ...t, tool_type: "INTEGRATION_TOOL", tool_phase: phase, integration_name: "Acme Lending", is_enabled: t.is_enabled ?? true, parameters: [] } : t;
      }),
    };
  };

  return {
    ...editorB,
    ...kbRoutes,
    ...whatsappAccountRoutes,
    ...whatsappToolRoutes,
    "GET /kb/all": knowledgeBases,
    "GET /agent/all": { status: "success", data: { agents: listAgents } },
    "GET /agent/*": (url: URL) => {
      const id = url.pathname.split("/").pop()!;
      return store[id] ? { agents: store[id] } : editorB["GET /agent/*"](url);
    },
    "PATCH /agent/v1": (url: URL, b: any) => {
      if (store[b?.agent_id]) {
        applyWhatsappPatch(b);
        return { message: "Agent updated successfully", agent_id: b.agent_id, version_id: b.version_id ?? V_WA };
      }
      return editorB["PATCH /agent/v1"](url, hydrateIntegrationTools(b));
    },
    // Both agent kinds list numbers with all=true; WhatsApp numbers sit next to the voice numbers.
    "GET /workspace/numbers": (url: URL) => {
      const voice = editorB["GET /workspace/numbers"](url).workspace_numbers;
      return { workspace_numbers: url.searchParams.get("all") === "true" ? [...voice, ...numbers] : voice };
    },
    "GET /whatsapp/embedded-signup/*/numbers": { numbers: waNumbers.map((n) => ({ ...n, is_registered: true })) },
    "GET /agent/api-tool-fields/*": (url: URL) => {
      const id = url.pathname.split("/").pop()!;
      if (!store[id]) return editorB["GET /agent/api-tool-fields/*"](url);
      const custom_args = (ver(id).agent_config.custom_variables as string[]).map((key) => ({ key, type: "variable", description: `Custom variable ${key}` }));
      return { custom_args, call_data: ["id", "from_number", "to_number", "status", "transcript"].map((key) => ({ key, type: "variable" })), tool_output: {} };
    },

    // Create flow (Assistants → Create agent → WhatsApp).
    ...Object.fromEntries(Object.entries(agentsCreateRoutes).filter(([k]) => k.startsWith("GET /v1/"))),
    "GET /v1/templates": { templates: allTemplates },
    "GET /v1/templates/*": (url: URL) => ({ template: allTemplates.find((t) => t.id === url.pathname.split("/").pop()) ?? allTemplates[0] }),
    "POST /v1/agent": async (_u: URL, b: any) => {
      await new Promise((r) => setTimeout(r, 4000));
      store[NEW_WA_ID] = emiAssistant(b?.inbound_number_id ?? "");
      if (b?.inbound_number_id) for (const n of numbers) if (n.id === b.inbound_number_id) n.agent = { id: NEW_WA_ID, agent_display_name: "EMI assistant" };
      return { message: "Agent created successfully", agent_id: NEW_WA_ID, agent_prompt: JSON.stringify(store[NEW_WA_ID].version_details[V_NEW].agent_config.agent_prompt) };
    },
  } as Record<string, unknown>;
}

export { PR_ID };
