import { NOW } from "./common.ts";

const base = { voice_avatar: "", template_icon: "", template_source: "ringg", created_at: "2026-09-01T10:00:00Z", updated_at: NOW, call_frequency_cap: null };

export const agents = [
  { ...base, id: "agt_payment_reminder", agent_display_name: "Payment reminder", agent_type: "outbound", orchestration_mode: "single_node", template_name: "payment_reminder", template_label: "Payment reminder", template_type: "outbound", updated_at: "2026-10-01T09:10:00Z" },
  { ...base, id: "agt_support_line", agent_display_name: "Support line", agent_type: "inbound", orchestration_mode: "single_node", template_name: "support", template_label: "Customer support", template_type: "inbound" },
  { ...base, id: "agt_lead_callback", agent_display_name: "Lead qualification", agent_type: "outbound_inbound", orchestration_mode: "single_node", template_name: "lead_qualification", template_label: "Lead qualification", template_type: "outbound" },
  { ...base, id: "agt_website", agent_display_name: "Website assistant", agent_type: "inbound", orchestration_mode: "single_node", template_name: "webcall", template_label: "Website assistant", template_type: "webcall" },
  { ...base, id: "agt_whatsapp", agent_display_name: "WhatsApp concierge", agent_type: "whatsapp", orchestration_mode: "single_node", template_name: "whatsapp", template_label: "WhatsApp", template_type: "whatsapp" },
  { ...base, id: "agt_loan_flow", agent_display_name: "Loan application flow", agent_type: "outbound", orchestration_mode: "multi_node", template_name: "multi", template_label: "Multi Prompt", template_type: "outbound", created_at: "2026-07-10T10:00:00Z", updated_at: "2026-08-02T10:00:00Z" },
];

export const agentRoutes = {
  "GET /agent/all": { status: "success", data: { agents } },
  "GET /agent/all/call_counts": { status: "success", data: { call_counts: { agt_payment_reminder: 1284, agt_support_line: 412, agt_lead_callback: 96, agt_website: 57, agt_whatsapp: 233, agt_loan_flow: 31 } } },
  "GET /workspace/features": {},
};
