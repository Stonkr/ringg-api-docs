// Campaigns area: list across statuses, detail records, CSV upload + verify polling, numbers, pools, concurrency.
// Shapes follow lib/api/campaigns.api.ts, types/campaign.types.ts, types/numbers.types.ts, types/number-pools.types.ts.
import { resolve } from "node:path";
import { NOW, user } from "./common.ts";
import { agentRoutes } from "./agents.ts";

export const CSV_PATH = resolve(import.meta.dirname, "payment-reminders.csv");
export const NEW_CAMPAIGN_ID = "cmp_oct_payment_reminders";

const DAY = 86_400_000;
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
/** ISO instant `days` from today at `hh:mm` IST. */
const ist = (days: number, hh: number, mm = 0) => new Date(today.getTime() + days * DAY + (hh * 60 + mm - 330) * 60_000).toISOString();

type Row = { id: string; name: string; status: string; agent: string; start: number; end: number; calls: number; contacts: number; invalid?: number; extra?: Record<string, unknown> };

const rows: Row[] = [
  { id: "cmp_overdue_mumbai", name: "Overdue accounts – Mumbai", status: "ongoing", agent: "agt_payment_reminder", start: -2, end: 3, calls: 318, contacts: 540, invalid: 4 },
  { id: "cmp_emi_week41", name: "EMI reminders – week 41", status: "ongoing", agent: "agt_payment_reminder", start: -1, end: 2, calls: 642, contacts: 1200, invalid: 12 },
  { id: "cmp_festive_topup", name: "Festive top-up offer", status: "scheduled", agent: "agt_lead_callback", start: 2, end: 6, calls: 0, contacts: 860 },
  { id: "cmp_kyc_renewal", name: "KYC renewal reminders", status: "draft", agent: "agt_payment_reminder", start: 1, end: 2, calls: 0, contacts: 310 },
  { id: "cmp_loan_topup", name: "Loan top-up outreach", status: "insufficient_balance", agent: "agt_lead_callback", start: 1, end: 4, calls: 0, contacts: 4200, extra: { additional_balance_required: "4500" } },
  { id: "cmp_sep_emi", name: "September EMI follow-ups", status: "completed", agent: "agt_payment_reminder", start: -20, end: -16, calls: 2310, contacts: 1450, invalid: 9 },
  { id: "cmp_web_leads", name: "Website sign-up callbacks", status: "completed", agent: "agt_lead_callback", start: -12, end: -10, calls: 455, contacts: 380 },
  { id: "cmp_policy_survey", name: "Insurance renewal survey", status: "terminated", agent: "agt_lead_callback", start: -9, end: -7, calls: 87, contacts: 600 },
  { id: "cmp_aug_collections", name: "August collections", status: "completed", agent: "agt_payment_reminder", start: -45, end: -40, calls: 1960, contacts: 1300, invalid: 21 },
];

export const campaigns = rows.map((r) => ({
  id: r.id,
  name: r.name,
  campaign_status: r.status,
  agent_id: r.agent,
  created_at: ist(r.start - 1, 11),
  updated_at: NOW,
  campaign_start_time: ist(r.start, 9),
  campaign_end_time: ist(r.end, 19),
  total_calls: r.calls,
  total_contacts: r.contacts,
  invalidated_rows_count: r.invalid ?? 0,
  invalidated_rows_csv_url: r.invalid ? `https://files.example.com/acme-lending/${r.id}/invalid_entries.csv` : null,
  csv_file_name: `${r.id.replace("cmp_", "")}.csv`,
  ...r.extra,
}));

const agentName = (id: string) => (agentRoutes["GET /agent/all"] as { data: { agents: { id: string; agent_display_name: string }[] } }).data.agents.find((a) => a.id === id)?.agent_display_name ?? "Payment reminder";

/** Mon–Sat 10:00–13:00 and 15:00–19:00 IST, as the API's absolute UTC instants. */
function slots(startDay: number, endDay: number) {
  const out: { start: string; end: string }[] = [];
  for (let d = startDay; d <= endDay; d++) {
    const weekday = new Date(today.getTime() + d * DAY).getUTCDay();
    if (weekday === 0) continue;
    out.push({ start: ist(d, 10), end: ist(d, 13) }, { start: ist(d, 15), end: ist(d, 19) });
  }
  return out;
}

function campaignInfo(id: string) {
  const r = rows.find((x) => x.id === id) ?? rows[0];
  return {
    id: r.id,
    name: r.name,
    campaign_status: r.status,
    call_config: {
      call_retry_config: { retry_count: 3, retry_busy: 30, retry_not_picked: 30, retry_failed: 30 },
      call_time: { call_start_time: "10:00", call_end_time: "19:00", timezone: "Asia/Kolkata", scheduled_at: null },
    },
    call_slots: slots(r.start, r.end),
    campaign_start_time: ist(r.start, 9),
    campaign_end_time: ist(r.end, 19),
    agent: { id: r.agent, name: agentName(r.agent) },
    invalidated_rows_count: r.invalid ?? 0,
    invalidated_rows_csv_url: r.invalid ? `https://files.example.com/acme-lending/${r.id}/invalid_entries.csv` : null,
  };
}

const number = (id: string, num: string, provider: string, created: string, tags: string[] = [], extra: Record<string, unknown> = {}) => ({
  id,
  number: num,
  created_at: created,
  agent: { id: "agt_payment_reminder", agent_display_name: "Payment reminder" },
  is_inbound_enabled: false,
  is_test_number: false,
  spam_message: "",
  tags,
  is_custom_number: false,
  owner: "workspace",
  telephony_id: `tel_${id}`,
  provider,
  number_pool_id: null,
  isExpired: false,
  expiry_date: "2027-06-01T00:00:00Z",
  ...extra,
});

export const numbers = [
  number("num_43210", "+919876543210", "plivo", "2026-06-12T09:00:00Z", ["collections"]),
  number("num_43211", "+919876543211", "plivo", "2026-06-12T09:00:00Z", ["collections"]),
  number("num_45120", "+919876545120", "exotel", "2026-07-03T09:00:00Z", ["sales"]),
  number("num_47788", "+919876547788", "exotel", "2026-08-21T09:00:00Z"),
  number("num_test", "+919876540000", "ringg", "2026-06-01T09:00:00Z", [], { is_test_number: true }),
];

const pool = (id: string, name: string, description: string, member_count: number, spam_count = 0) => ({
  id,
  workspace_id: "ws_demo",
  name,
  description,
  auto_purchase_enabled: false,
  auto_purchase_telephony_account_id: null,
  auto_purchase_config: null,
  additional_notification_emails: null,
  member_count,
  spam_count,
  active: true,
  is_default: false,
  created_at: "2026-07-01T09:00:00Z",
  updated_at: NOW,
  spam_numbers: [],
});

export const pools = [
  pool("pool_collections", "Collections – Mumbai", "Rotates the Mumbai collections numbers", 6),
  pool("pool_sales", "Sales outreach", "Numbers for offers and callbacks", 4, 1),
  pool("pool_new", "New pool (empty)", "No numbers added yet", 0),
];

export const workspaceUsers = [
  { id: user.id, username: user.name, email: user.email, role: "owner" },
  { id: "usr_rahul", username: "Rahul Khanna", email: "rahul@acme-lending.example", role: "admin" },
  { id: "usr_neha", username: "Neha Gupta", email: "neha@acme-lending.example", role: "member" },
];

const paymentReminderAgent = {
  agents: {
    id: "agt_payment_reminder",
    agent_display_name: "Payment reminder",
    orchestration_mode: "single_node",
    agent_type: "outbound",
    version_details: { latest: { agent_config: { custom_variables: ["callee_name", "mobile_number", "amount_due", "due_date"] } } },
  },
};

// Set once Create campaign is pressed, so the list then shows the new campaign.
let created = false;
const newCampaign = () => ({ ...campaigns[0], id: NEW_CAMPAIGN_ID, name: "October payment reminders", campaign_status: "scheduled", campaign_start_time: ist(0, 18), campaign_end_time: ist(1, 18), total_calls: 0, total_contacts: 9, invalidated_rows_count: 1, created_at: new Date().toISOString() });

export const campaignRoutes = {
  ...agentRoutes,
  "GET /campaign/all": (url: URL) => {
    const list = created ? [newCampaign(), ...campaigns] : campaigns;
    const all = url.searchParams.get("search") ? list.filter((c) => c.name.toLowerCase().includes(url.searchParams.get("search")!.toLowerCase())) : list;
    return { campaigns: all, pagination: { total: all.length, limit: Number(url.searchParams.get("limit") ?? 50), offset: 0 } };
  },
  "GET /campaign/info/*": (url: URL) => campaignInfo(url.pathname.split("/").pop()!),
  "GET /agent/*": (url: URL) => {
    const id = url.pathname.split("/").pop()!;
    return { ...paymentReminderAgent, agents: { ...paymentReminderAgent.agents, id, agent_display_name: agentName(id) } };
  },
  "POST /campaign/upload-csv": () => {
    created = false;
    return { bulk_list_id: NEW_CAMPAIGN_ID, message: "CSV uploaded", status: "in_db", total_rows: 10, campaign_name: "October payment reminders" };
  },
  // Verification takes ~2 s, then reports "draft" (verified) with one invalid row.
  "GET /campaign/upload-status/*": async () => {
    await new Promise((r) => setTimeout(r, 2000));
    return { status: "draft", campaign_id: NEW_CAMPAIGN_ID, total_contacts: 9, invalidated_rows_count: 1, invalid_entries_file: `https://files.example.com/acme-lending/${NEW_CAMPAIGN_ID}/invalid_entries.csv` };
  },
  "POST /campaign/make-call-async": () => {
    created = true;
    return { message: "Campaign scheduled successfully" };
  },
  "GET /workspace/numbers": { workspace_numbers: numbers },
  "GET /number-pool": { status: "success", data: { pools, limit: 100, offset: 0, count: pools.length } },
  "GET /workspace/users": { workspace_users: workspaceUsers },
  "GET /workspace/concurrency": { api_concurrency_pct: 30 },
  "PATCH /workspace/concurrency": { message: "Concurrency settings updated" },
  "GET /campaign/concurrency": {
    api_concurrency_pct: 30,
    campaigns: [
      { campaign_id: "cmp_overdue_mumbai", name: "Overdue accounts – Mumbai", concurrency_percentage: 40 },
      { campaign_id: "cmp_emi_week41", name: "EMI reminders – week 41", concurrency_percentage: 60 },
    ],
  },
  "PATCH /campaign/concurrency": { message: "Campaign concurrency updated" },
  "PATCH /campaign/terminate": { message: "Campaign terminated" },
  "GET /campaign/report/*": { message: "Your report will be emailed to you shortly." },
  // No call limit set, so the read-only Call limits card stays hidden; no G2 review prompt.
  "GET /workspace/call-frequency-cap": { status: "success", enabled: false },
  "GET /workspace/call-frequency-cap/agent/*": { status: "success", enabled: false },
  "GET /g2-reviews/review-prompt": { show: false, allow_opt_out: false },
};
