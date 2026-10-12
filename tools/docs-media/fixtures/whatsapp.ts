// WhatsApp Business fixtures: the connected account (Tools → WhatsApp Business), its numbers and message
// templates, the WhatsApp numbers in the workspace list, the integrations catalog and the WhatsApp tools
// offered in the agent editor. Shapes follow the production source: WABAAccount / WABANumber / WATemplate
// (types/whatsapp.types.ts), IntegrationCatalogItem / IntegrationToolsAllItem (types/integrations.types.ts).
// Fictional data only: Acme Lending, +91 98765 4xxxx numbers, made-up Meta ids.
import { NOW } from "./common.ts";

export const WA_ACCOUNT_ID = "tel_wa_acme";
export const WA_WABA_ID = "1002003004005";

/** The two WhatsApp Business numbers on the account. The first is registered (Ready), the second verified but not yet registered (Pending). */
export const waNumbers = [
  { phone_number_id: "wa_pn_40321", display_phone_number: "+91 98765 40321", verified_name: "Acme Lending", code_verification_status: "VERIFIED", quality_rating: "GREEN", is_registered: true, created_at: "2026-08-20T10:00:00Z" },
  { phone_number_id: "wa_pn_40322", display_phone_number: "+91 98765 40322", verified_name: "Acme Lending Collections", code_verification_status: "VERIFIED", quality_rating: "UNKNOWN", is_registered: false, created_at: "2026-10-01T09:40:00Z" },
];

export const waAccount = {
  telephony_account_id: WA_ACCOUNT_ID,
  name: "Acme Lending",
  waba_id: WA_WABA_ID,
  numbers: waNumbers.map((n) => ({ phone_number_id: n.phone_number_id, number: n.display_phone_number })),
};

const positional = (text: string, examples: string[]) => ({ type: "BODY", text, example: { body_text: [examples] } });
const named = (text: string, examples: [string, string][]) => ({ type: "BODY", text, example: { body_text_named_params: examples.map(([param_name, example]) => ({ param_name, example })) } });

export const waTemplates = [
  {
    id: "wat_emi_due_reminder", name: "emi_due_reminder", status: "APPROVED", category: "UTILITY", language: "en", parameter_format: "POSITIONAL", variable_count: 4,
    components: [
      positional("Hi {{1}}, your EMI of ₹{{2}} for loan {{3}} is due on {{4}}. Reply PAY for a UPI link, or tap a button below.", ["Rahul", "12,450", "PL-4821", "10 October"]),
      { type: "FOOTER", text: "Acme Lending" },
      { type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "Pay now" }, { type: "QUICK_REPLY", text: "Call me back" }] },
    ],
    last_used_at: "2026-10-06T06:12:00Z",
  },
  {
    id: "wat_payment_receipt", name: "payment_receipt", status: "APPROVED", category: "UTILITY", language: "en", parameter_format: "NAMED", variable_count: 3, variable_names: ["customer_name", "amount", "loan_account"],
    components: [named("Hi {{customer_name}}, we have received ₹{{amount}} towards loan {{loan_account}}. Your receipt is on its way to your email. Thank you!", [["customer_name", "Priya"], ["amount", "8,200"], ["loan_account", "PL-3390"]])],
    last_used_at: "2026-10-05T12:30:00Z",
  },
  {
    id: "wat_loan_offer_oct", name: "loan_offer_oct", status: "PENDING", category: "MARKETING", language: "en", parameter_format: "POSITIONAL", variable_count: 1,
    components: [positional("Hi {{1}}, you are pre-approved for a top-up loan this festive season. Reply YES to hear the offer.", ["Rahul"]), { type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "Yes, tell me more" }] }],
  },
  {
    id: "wat_kyc_update_request", name: "kyc_update_request", status: "REJECTED", category: "UTILITY", language: "hi", parameter_format: "POSITIONAL", variable_count: 1,
    components: [positional("नमस्ते {{1}}, कृपया अपने लोन खाते के लिए KYC विवरण अपडेट करें।", ["राहुल"])],
  },
];

/** Workspace numbers list entries for the two WhatsApp numbers (provider "whatsapp"). `agent` marks which agent answers on it. */
export const waWorkspaceNumber = (id: string, n: string, agent: { id: string; agent_display_name: string } | null) => ({
  id, number: n, created_at: "2026-08-20T10:00:00Z", agent, is_inbound_enabled: true, is_test_number: false, spam_message: "", tags: [], is_custom_number: false,
  owner: "customer", telephony_id: WA_ACCOUNT_ID, provider: "whatsapp", number_pool_id: null, isExpired: false, expiry_date: null,
});

const icon = (slug: string, color: string) => `https://cdn.simpleicons.org/${slug}/${color}`;
const tool = (provider_id: string, tool_name: string, display_name: string, description: string, supported_phases: string[], icon_url: string) => ({
  tool_id: `${provider_id}.${tool_name}`, tool_name, display_name, description, provider_id, integration_category: "messaging", icon_url, supported_phases, parameters: [],
});

export const WHATSAPP_ICON = "/dashboard/icons/whatsapp.svg";
export const whatsappTools = [
  tool("whatsapp_business", "send_template_message", "Send WhatsApp Template", "Send an approved message template with its variables filled. Delivered at any time.", ["on_call", "post_call"], WHATSAPP_ICON),
  tool("whatsapp_business", "send_text_message", "Send WhatsApp Text", "Send free-form text. Delivered only within 24 hours of the customer's last WhatsApp message.", ["on_call"], WHATSAPP_ICON),
];

/** GET /integrations/catalog: the "Add more tools" grid. `connected` decides whether the WhatsApp card shows "1 Connected". */
export const integrationsCatalog = (connected: boolean) => [
  {
    provider_id: "whatsapp_business", display_name: "WhatsApp Business", category: "messaging", description: "Send templates and messages on your WhatsApp Business number, during or after a conversation.", icon_url: WHATSAPP_ICON,
    connected_accounts: connected ? [{ integration_id: WA_ACCOUNT_ID, integration_name: "Acme Lending", status: "active", status_message: "", masked_credentials: {} }] : [],
    available_tools: whatsappTools,
  },
  { provider_id: "google_sheets", display_name: "Google Sheets", category: "productivity", description: "Read rows from a sheet before a call and append the outcome after it.", icon_url: icon("googlesheets", "34A853"), connected_accounts: [], available_tools: [] },
  { provider_id: "google_calendar", display_name: "Google Calendar", category: "scheduling", description: "Check availability and book slots on a shared calendar.", icon_url: icon("googlecalendar", "4285F4"), connected_accounts: [], available_tools: [] },
  { provider_id: "calendly", display_name: "Calendly", category: "scheduling", description: "Offer open Calendly slots and book the one the customer picks.", icon_url: icon("calendly", "006BFF"), connected_accounts: [], available_tools: [] },
  { provider_id: "hubspot", display_name: "HubSpot", category: "crm", description: "Look up contacts and log each conversation on the deal.", icon_url: icon("hubspot", "FF7A59"), connected_accounts: [], available_tools: [] },
  { provider_id: "slack", display_name: "Slack", category: "messaging", description: "Post a summary to a channel when a conversation ends.", icon_url: icon("slack", "4A154B"), connected_accounts: [], available_tools: [] },
  { provider_id: "zoho_crm", display_name: "Zoho CRM", category: "crm", description: "Fetch lead details and write back the call outcome.", icon_url: icon("zoho", "E42527"), connected_accounts: [], available_tools: [] },
];

/** GET /integrations/tools/all: the accounts listed under Integration in the editor's tools side panel. */
export const integrationToolsAll = [
  { provider_id: "whatsapp_business", display_name: "WhatsApp Business", integration_name: "Acme Lending", description: "WhatsApp Business account Acme Lending", category: "messaging", icon_url: WHATSAPP_ICON, integration_id: WA_ACCOUNT_ID, status: "active", tools: whatsappTools },
];

/** Routes the WhatsApp tool config reads: sender numbers, approved templates, account setup, the test run. */
export const whatsappToolRoutes = {
  "GET /integrations/catalog": integrationsCatalog(true),
  "GET /integrations/tools/all": integrationToolsAll,
  "GET /integrations/whatsapp_business/setup": { provider_id: "whatsapp_business", display_name: "WhatsApp Business", auth_type: "embedded_signup", icon_url: WHATSAPP_ICON, credential_fields: [], required_fields: [], documentation_url: "https://docs.ringg.ai/whatsapp/on-call-tools" },
  "GET /integrations/whatsapp_business/*/field-options/from_number": { options: waNumbers.filter((n) => n.is_registered).map((n) => ({ value: n.phone_number_id, label: n.display_phone_number, verified_name: n.verified_name })) },
  "GET /integrations/whatsapp_business/*/field-options/template": {
    options: waTemplates.filter((t) => t.status === "APPROVED").map((t) => ({ value: t.name, label: t.name, language: t.language, variable_count: t.variable_count, parameter_format: t.parameter_format, variable_names: t.variable_names ?? [] })),
  },
  "POST /integrations/whatsapp_business/execute": { success: true, wamid: "wamid.docs0000000000000000000001", to: "+919876543210" },
};

/** Routes for a connected account: Tools → WhatsApp Business opens the account page. */
export const whatsappAccountRoutes = {
  "GET /whatsapp/embedded-signup/accounts": { accounts: [waAccount] },
  "GET /whatsapp/embedded-signup/*/numbers": { numbers: waNumbers },
  "GET /whatsapp/embedded-signup/*/templates": { templates: waTemplates },
  "GET /whatsapp/embedded-signup/provision-number": { provisionings: [] },
};

/** Stateful routes for the onboarding scenario: connect (after Meta's window), register the pending number, create a template, send a test. */
export function makeWhatsappOnboardingRoutes() {
  const state = { connected: false, numbers: waNumbers.map((n) => ({ ...n })), templates: waTemplates.map((t) => ({ ...t })) };
  let seq = 0;
  return {
    ...whatsappToolRoutes,
    "GET /integrations/catalog": () => integrationsCatalog(state.connected),
    "GET /whatsapp/embedded-signup/accounts": () => ({ accounts: state.connected ? [waAccount] : [] }),
    "POST /whatsapp/embedded-signup/exchange": async () => {
      await new Promise((r) => setTimeout(r, 1800));
      state.connected = true;
      return { telephony_account_id: WA_ACCOUNT_ID, waba_id: WA_WABA_ID, name: "Acme Lending", message: "WhatsApp Business account connected" };
    },
    "GET /whatsapp/embedded-signup/*/numbers": () => ({ numbers: state.numbers }),
    "GET /whatsapp/embedded-signup/provision-number": { provisionings: [] },
    "GET /workspace/numbers": () => ({ workspace_numbers: state.numbers.filter((n) => n.is_registered).map((n) => waWorkspaceNumber(`num_${n.phone_number_id}`, n.display_phone_number.replace(/\s/g, ""), null)) }),
    "POST /whatsapp/embedded-signup/register-number": async (_u: URL, b: any) => {
      await new Promise((r) => setTimeout(r, 1200));
      const n = state.numbers.find((x) => x.phone_number_id === b?.phone_number_id);
      if (n) n.is_registered = true;
      return { from_number_id: `num_${b?.phone_number_id}`, number: n?.display_phone_number ?? "", provider_number_id: b?.phone_number_id, telephony_account_id: WA_ACCOUNT_ID, message: "Number registered" };
    },
    "GET /whatsapp/embedded-signup/*/templates": () => ({ templates: state.templates }),
    "POST /whatsapp/embedded-signup/templates": async (_u: URL, b: any) => {
      await new Promise((r) => setTimeout(r, 1200));
      const id = `wat_new_${++seq}`;
      state.templates.unshift({ id, name: b?.name, status: "PENDING", category: b?.category ?? "UTILITY", language: b?.language ?? "en", parameter_format: "POSITIONAL", variable_count: 0, components: b?.components ?? [] });
      return { id, name: b?.name, status: "PENDING", category: b?.category ?? "UTILITY" };
    },
    "POST /whatsapp/embedded-signup/send-test": async (_u: URL, b: any) => {
      await new Promise((r) => setTimeout(r, 1000));
      return { message_id: "wamid.docs0000000000000000000002", to_number: b?.to_number ?? "", status: "accepted" };
    },
  } as Record<string, unknown>;
}
