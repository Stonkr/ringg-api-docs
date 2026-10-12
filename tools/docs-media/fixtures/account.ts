// Account (Settings) fixtures: members, company details, workspace logs, API key, billing, call limits, sub-workspaces.
// Every route set is a factory so each scenario starts from a clean state (POST/PATCH handlers mutate it).
// Fictional data only. The API key is a visibly fake demo value.
import { NOW, user, workspace } from "./common.ts";

type Routes = Record<string, unknown>;

const EMAIL_DOMAIN = "acme-lending.example";
const ownerWorkspace = { ...workspace, role: "owner", email_domain: EMAIL_DOMAIN, verified_numbers: [] };

const features = (subWorkspaces = false) => ({ workspace_id: workspace.id, features: { sub_workspaces_enabled: subWorkspaces } });

/** Shell overrides every account page needs: the viewer is the owner, with a company email domain. */
const accountShell = (subWorkspaces = false): Routes => ({
  "GET /workspace/all": { workspaces: [ownerWorkspace] },
  "GET /workspace": { workspace_info: ownerWorkspace },
  "GET /workspace/features": features(subWorkspaces),
  "POST /lifecycle-events": { status: "success" },
});

// ---------- Members ----------

const member = (id: string, username: string, local: string, permissions: string[], invite_status = "success", role = "member") => ({
  id,
  username,
  email: `${local}@${EMAIL_DOMAIN}`,
  role,
  avatar: "",
  invite_status,
  permissions,
});

const baseMembers = () => [
  member(user.id, user.name, "priya", [], "success", "owner"),
  member("usr_arjun", "Arjun Mehta", "arjun.mehta", ["agents", "campaigns"]),
  member("usr_kavya", "Kavya Iyer", "kavya.iyer", ["campaigns"]),
  member("usr_rohan", "Rohan Gupta", "rohan.gupta", ["numbers", "knowledge_base"]),
  member("usr_meera", "Meera Nair", "meera.nair", []),
  member("usr_vikram", "Vikram Singh", "vikram.singh", [], "pending"),
];

const workspaceLogs = [
  { op: "edited", type: "workspace_user", name: "Kavya Iyer", rid: "usr_kavya", by: "priya", at: "2026-10-01T09:42:00Z", extra: { permissions: ["campaigns"] } },
  { op: "invited", type: "workspace_user", name: "Vikram Singh", rid: "usr_vikram", by: "priya", at: "2026-10-01T09:15:00Z", extra: { invitee_email: `vikram.singh@${EMAIL_DOMAIN}` } },
  { op: "edited", type: "agent", name: "Payment reminder", rid: "agt_payment_reminder", by: "arjun.mehta", at: "2026-09-30T17:20:00Z", extra: { fields: ["prompt"] } },
  { op: "created", type: "campaign", name: "October EMI reminders", rid: "cmp_oct_emi", by: "kavya.iyer", at: "2026-09-30T11:05:00Z", extra: { agent_id: "agt_payment_reminder" } },
  { op: "edited", type: "number", name: "+91 98765 43210", rid: "num_mumbai_01", by: "rohan.gupta", at: "2026-09-29T15:48:00Z", extra: { attached_agent: "agt_support_line" } },
  { op: "created", type: "knowledge_base", name: "Loan FAQs", rid: "kb_loan_faqs", by: "rohan.gupta", at: "2026-09-29T10:12:00Z", extra: { files: 3 } },
  { op: "created", type: "alert", name: "Low pickup rate", rid: "alr_low_pickup", by: "priya", at: "2026-09-26T08:30:00Z", extra: { threshold: "40%" } },
  { op: "edited", type: "agent", name: "Lead qualification", rid: "agt_lead_callback", by: "arjun.mehta", at: "2026-09-25T16:02:00Z", extra: { fields: ["voice"] } },
  { op: "removed", type: "workspace_user", name: "Ishaan Kapoor", rid: "usr_ishaan", by: "priya", at: "2026-09-24T12:40:00Z", extra: {} },
  { op: "created", type: "agent", name: "WhatsApp concierge", rid: "agt_whatsapp", by: "arjun.mehta", at: "2026-09-22T09:55:00Z", extra: { agent_type: "whatsapp" } },
].map((l, i) => ({
  id: `wlog_${String(1040 - i).padStart(6, "0")}`,
  operation_type: l.op,
  resource_type: l.type,
  resource_id: l.rid,
  operation_details: { operation: l.op, resource_name: l.name, ...l.extra },
  created_at: l.at,
  user_id: l.by === "priya" ? user.id : `usr_${l.by.split(".")[0]}`,
  user_email: `${l.by}@${EMAIL_DOMAIN}`,
}));

const companyDetails = {
  basicInfo: { companyName: "Acme Lending Private Limited", isBusiness: true, gstNumber: "27AAACA0000A1Z5", panNumber: "AAACA0000A", entityType: "private_limited" },
  address: { address: "4th Floor, Example Towers, Bandra Kurla Complex", city: "Mumbai", state: "Maharashtra", country: "India", pincode: "400051" },
  poc: { firstName: "Priya", lastName: "Sharma", email: `priya@${EMAIL_DOMAIN}` },
};

export function membersRoutes(): Routes {
  const members = baseMembers();
  return {
    ...accountShell(),
    "GET /workspace/users": () => ({ workspace_users: members }),
    "POST /workspace/invite/send": (_u: URL, body: any) => {
      const email = String(body?.invitee_email ?? "");
      const local = email.split("@")[0] ?? "new.member";
      const name = local.split(/[._]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      members.push({ ...member(`usr_${local.replace(/\W/g, "")}`, name, local, body?.permissions ?? [], "pending"), email });
      return { message: "Workspace invitation sent" };
    },
    "PATCH /workspace/users/manage": (_u: URL, body: any) => {
      const m = members.find((x) => x.id === body?.user_id);
      if (m && body?.operation === "change_permissions" && Array.isArray(body.permissions)) m.permissions = body.permissions;
      return { message: "Member updated" };
    },
    "GET /workspace/logs": { logs: workspaceLogs, offset: 0, limit: 20, total_count: workspaceLogs.length, has_more: false },
    "POST /workspace/logs/export": {},
    "GET /billing/workspace": companyDetails,
    "PATCH /billing/workspace": (_u: URL, body: unknown) => body,
  };
}

// ---------- API key ----------

/** Visibly fake: never shaped like a real key. */
export const DEMO_API_KEY = "rg_live_demo_NOT-A-REAL-KEY-docs-only-0000";

export function apiKeyRoutes(): Routes {
  let exists = false;
  return {
    ...accountShell(),
    "GET /workspace/api-key": () =>
      exists ? { exists: true, masked_key: "rg_live_demo_••••••••0000", prefix: "rg_live_demo_", last_four: "0000", created_at: NOW, regenerated_at: null, role: "owner" } : { exists: false, role: "owner" },
    "POST /workspace/api-key": () => {
      exists = true;
      return { api_key: DEMO_API_KEY, prefix: "rg_live_demo_", last_four: "0000", created_at: NOW, regenerated_at: null };
    },
  };
}

// ---------- Billing ----------

const payment = (net: number) => ({
  net_amount: net.toFixed(2),
  gst_amount: (net * 0.18).toFixed(2),
  gst_rate: "18",
  paid_by: { name: "Acme Lending Private Limited", address: "Bandra Kurla Complex, Mumbai", gstin: "27AAACA0000A1Z5", pan: "AAACA0000A", email: `priya@${EMAIL_DOMAIN}` },
  paid_to: { name: "Ringg AI", address: "Bengaluru", gstin: "", pan: "", email: "" },
});
const deduction = (category: string, description: string) => ({ deduction_category: category, deduction_description: description });

const ledger = [
  { transaction_id: "txn_9f3c2a71", date: "2026-10-01T09:58:00Z", amount: "500.00", description: "Coupon WELCOME500 redeemed", status: "success", transaction_type: "credit", payment_description: null, deduction_description: null },
  { transaction_id: "txn_8e21b6d4", date: "2026-09-30T18:00:00Z", amount: "2140.50", description: "call charges", status: "success", transaction_type: "debit", payment_description: null, deduction_description: deduction("call_charges", "Call charges for 30 Sep") },
  { transaction_id: "txn_7d55e019", date: "2026-09-28T11:24:00Z", amount: "10000.00", description: "wallet recharge", status: "success", transaction_type: "credit", payment_description: payment(10000), deduction_description: null },
  { transaction_id: "txn_6c48a3f2", date: "2026-09-27T16:40:00Z", amount: "5000.00", description: "wallet recharge", status: "failed", transaction_type: "credit", payment_description: payment(5000), deduction_description: null },
  { transaction_id: "txn_5b12f8c6", date: "2026-09-25T10:05:00Z", amount: "2000.00", description: "concurrency purchase", status: "success", transaction_type: "debit", payment_description: null, deduction_description: deduction("concurrency", "5 concurrent calls") },
  { transaction_id: "txn_4a07c2e8", date: "2026-09-20T18:00:00Z", amount: "1835.25", description: "call charges", status: "success", transaction_type: "debit", payment_description: null, deduction_description: deduction("call_charges", "Call charges for 20 Sep") },
  { transaction_id: "txn_39f1d6b0", date: "2026-09-15T09:30:00Z", amount: "15000.00", description: "wallet recharge", status: "success", transaction_type: "credit", payment_description: payment(15000), deduction_description: null },
  { transaction_id: "txn_28e4a5c3", date: "2026-09-01T00:05:00Z", amount: "600.00", description: "number rental", status: "success", transaction_type: "debit", payment_description: null, deduction_description: deduction("number_rental", "2 numbers, September") },
].map((t) => ({ ...t, currency: "INR" }));

export function billingRoutes(): Routes {
  const state = { credits: 12500, allocated: 10, maxAllocated: 10 };
  const plan = () => ({
    plan_name: "Growth",
    plan_description: "Pay as you go, billed per minute",
    plan_type: "prepaid",
    currency: "INR",
    available_credits: state.credits.toFixed(2),
    call_charges: { pricing_type: "MINUTE_BASED", billing_unit: "minute", call_charge: "6.00", pulse_duration: 60, tier_name: "Standard", tier_order: 1, tier_description: "" },
    number_rental_charges: { rental_structure: "flat", rate_per_number: "300", tier_min_numbers: 0, tier_max_numbers: 100 },
    concurrency_charges: {
      plan_name: "Growth",
      unit_charge: "400.00",
      currency: "INR",
      allocated_concurrency: state.allocated,
      max_allocated_concurrency: state.maxAllocated,
      free_concurrency: 2,
      billable_concurrency: Math.max(state.allocated - 2, 0),
      total_charge: (Math.max(state.allocated - 2, 0) * 400).toFixed(2),
    },
    analytics: "Included",
    billing_type: "prepaid",
  });
  return {
    ...accountShell(),
    "GET /billing/bill-plans/current": () => plan(),
    "GET /billing/ledger": () => ({ items: ledger, total_pages: 1, page_size: 20, current_page: 1 }),
    "POST /billing/coupons/redeem": (_u: URL, body: any) => {
      state.credits += 500;
      return { redemption_id: "red_0001", coupon_code: body?.code ?? "WELCOME500", credited_amount: "500.00", currency: "INR", message: "Coupon redeemed" };
    },
    "POST /payment/concurrency/buy": (_u: URL, body: any) => {
      const target = Number(body?.concurrency ?? state.allocated);
      const charge = Math.max(target - Math.max(state.maxAllocated, 2), 0) * 400;
      state.credits -= charge;
      state.allocated = target;
      state.maxAllocated = Math.max(state.maxAllocated, target);
      return { message: "Concurrency updated", concurrency: target, amount_deducted: charge, currency: "INR", remaining_balance: state.credits, remaining_credits: state.credits };
    },
  };
}

// ---------- Call limits ----------

/** Replays a made-up week of outbound dials: stricter limits and longer windows hold back more. */
function projection(maxCalls: number, windowMinutes: number) {
  const evaluated = 4820;
  const pct = Math.min(60, (30 * Math.sqrt(windowMinutes / 1440)) / Math.max(1, maxCalls));
  return {
    status: "success",
    policy: { max_calls: maxCalls, window_minutes: windowMinutes },
    sampled_over_minutes: 10080 + windowMinutes,
    scored_over_minutes: 10080,
    evaluated_calls: evaluated,
    would_block: Math.round((evaluated * pct) / 100),
    would_block_pct: pct,
    distinct_callees: 1390,
    coverage_pct: 92,
  };
}

export function callLimitRoutes(): Routes {
  let policy = { enabled: false, max_calls: 10, window_minutes: 1440 };
  return {
    ...accountShell(),
    "GET /workspace/call-frequency-cap": () => ({ status: "success", ...policy }),
    "PATCH /workspace/call-frequency-cap": (_u: URL, body: any) => {
      policy = { enabled: Boolean(body?.enabled), max_calls: Number(body?.max_calls), window_minutes: Number(body?.window_minutes) };
      return { status: "success", ...policy, agents_updated: 0 };
    },
    "POST /workspace/call-frequency-cap/projection": (_u: URL, body: any) => projection(Number(body?.max_calls ?? 10), Number(body?.window_minutes ?? 1440)),
  };
}

// ---------- Sub-workspaces ----------

export function subWorkspaceRoutes(): Routes {
  const subs = [
    { id: "ws_collections", name: "Collections", created_at: "2026-07-02T09:00:00Z", concurrency: 10, members: { direct: 2, inherited: 4 }, usage: 18240.5, balance: 3000 },
    { id: "ws_support", name: "Customer Support", created_at: "2026-08-11T09:00:00Z", concurrency: 8, members: { direct: 1, inherited: 4 }, usage: 9615.25, balance: 1500 },
  ];
  // Prepaid family: the primary's unallocated pot; each sub holds its own balance taken from it.
  let pot = workspace.credits;
  const invited: { email: string; username: string; subId: string }[] = [];
  const capacity = 25;
  const allocated = () => subs.reduce((t, s) => t + s.concurrency, 0);
  const billing = (credits: number) => ({ account_type: "prepaid", currency: "INR", total_available_credits: credits.toFixed(2) });

  const subRow = (s: (typeof subs)[number]) => ({ ...ownerWorkspace, id: s.id, name: s.name, parent_workspace_id: workspace.id, created_at: s.created_at, credits: 0, total_available_credits: 0 });

  const overview = () => ({
    primary: { id: workspace.id, name: workspace.name, concurrency: capacity, limit_concurrency: capacity, member_count: 4, billing: billing(pot), usage_this_period: "2410.00" },
    sub_workspaces: subs.map((s) => ({
      id: s.id,
      name: s.name,
      created_at: s.created_at,
      concurrency: s.concurrency,
      limit_concurrency: s.concurrency,
      member_counts: s.members,
      billing: billing(s.balance),
      usage_this_period: s.usage.toFixed(2),
    })),
    family: { concurrency_capacity: capacity, concurrency_allocated: allocated(), concurrency_available: Math.max(capacity - allocated(), 0) },
  });

  const primaryMembers = baseMembers().slice(0, 4);
  const familyMembers = () => [
    ...primaryMembers.map((m) => ({ user_id: m.id, email: m.email, username: m.username, role: m.role, scope: "primary", sub_workspace_ids: [], permissions_by_workspace: { [workspace.id]: m.permissions }, invite_status: m.invite_status })),
    { user_id: "usr_neha", email: `neha.joshi@${EMAIL_DOMAIN}`, username: "Neha Joshi", role: "member", scope: "sub", sub_workspace_ids: ["ws_collections"], permissions_by_workspace: { ws_collections: ["campaigns"] }, invite_status: "success" },
    { user_id: "usr_aditya", email: `aditya.rao@${EMAIL_DOMAIN}`, username: "Aditya Rao", role: "member", scope: "sub", sub_workspace_ids: ["ws_collections"], permissions_by_workspace: { ws_collections: ["agents", "campaigns"] }, invite_status: "success" },
    { user_id: "usr_farah", email: `farah.khan@${EMAIL_DOMAIN}`, username: "Farah Khan", role: "member", scope: "sub", sub_workspace_ids: ["ws_support"], permissions_by_workspace: { ws_support: ["agents"] }, invite_status: "pending" },
    ...invited.map((i) => ({ user_id: `usr_${i.email.split("@")[0].replace(/\W/g, "")}`, email: i.email, username: i.username, role: "member", scope: "sub", sub_workspace_ids: [i.subId], permissions_by_workspace: { [i.subId]: [] }, invite_status: "pending" })),
  ];

  return {
    ...accountShell(true),
    "GET /workspace/all": () => ({ workspaces: [ownerWorkspace, ...subs.map(subRow)] }),
    "GET /workspace/sub": () => overview(),
    "GET /workspace/sub/members": () => ({ primary_workspace_id: workspace.id, members: familyMembers() }),
    // The stub cannot read the workspace-scope header, so every sub's panel shows the primary's members as inherited plus anyone invited in this run.
    "GET /workspace/users": () => ({
      workspace_users: [
        ...invited.map((i) => ({ ...member(`usr_${i.email.split("@")[0].replace(/\W/g, "")}`, i.username, i.email.split("@")[0], [], "pending"), is_inherited: false })),
        ...primaryMembers.map((m) => ({ ...m, is_inherited: true, inherited_from_workspace_id: workspace.id })),
      ],
    }),
    "POST /workspace/invite/send": (_u: URL, body: any) => {
      const email = String(body?.invitee_email ?? "");
      const username = email.split("@")[0].split(/[._]/).map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(" ");
      const sub = subs.at(-1)!;
      invited.push({ email, username, subId: sub.id });
      sub.members.direct += 1;
      return { message: "Workspace invitation sent" };
    },
    "PATCH /workspace/sub/credit-balances": (_u: URL, body: any) => {
      for (const sub of subs) {
        const next = Number(body?.allocations?.[sub.id] ?? sub.balance);
        pot -= next - sub.balance;
        sub.balance = next;
      }
      return { parent_workspace_id: workspace.id, parent_available_balance: pot.toFixed(2), allocations: Object.fromEntries(subs.map((x) => [x.id, x.balance.toFixed(2)])), primary: { id: workspace.id, name: workspace.name } };
    },
    "POST /workspace/sub": (_u: URL, body: any) => {
      const name = String(body?.name ?? "New sub-workspace");
      const id = `ws_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      subs.push({ id, name, created_at: NOW, concurrency: 0, members: { direct: 0, inherited: 4 }, usage: 0, balance: 0 });
      return { message: `${name} created`, sub_workspace: { id, name, parent_workspace_id: workspace.id, created_at: NOW, concurrency: 0, limit_concurrency: 0 } };
    },
    "PATCH /workspace/sub/*/concurrency": (u: URL, body: any) => {
      const id = decodeURIComponent(u.pathname.split("/").at(-2) ?? "");
      const sub = subs.find((s) => s.id === id);
      if (sub) sub.concurrency = Number(body?.concurrency ?? 0);
      return {
        message: "Concurrency updated",
        sub_workspace_id: id,
        concurrency: sub?.concurrency ?? 0,
        limit_concurrency: sub?.concurrency ?? 0,
        primary: { id: workspace.id, name: workspace.name },
        family: { parent_concurrency: capacity, allocated_total: allocated() },
      };
    },
  };
}
