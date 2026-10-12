// Numbers area fixtures: workspace numbers, telephony accounts, numbers to buy/import, number pools.
// Shapes follow types/numbers.types.ts, types/byot.types.ts and types/number-pools.types.ts in the dashboard.
// Call makeNumbersRoutes() once per scenario: purchases, imports, new accounts and pools are kept in memory.
import { NOW } from "./common.ts";

const ws = "ws_demo";
const noAgent = null as unknown as { id: string; agent_display_name: string };

type Num = {
  id: string; number: string; created_at: string; agent: { id: string; agent_display_name: string } | null;
  is_inbound_enabled: boolean; is_test_number: boolean; spam_message: string; tags: string[]; is_custom_number: boolean;
  owner: string; telephony_id: string; provider: string; number_pool_id: string | null; isExpired: boolean; expiry_date: string;
};

const num = (n: Partial<Num> & Pick<Num, "id" | "number" | "created_at" | "provider">): Num => ({
  agent: noAgent, is_inbound_enabled: false, is_test_number: false, spam_message: "", tags: [], is_custom_number: false,
  owner: "ringg", telephony_id: "tel_ringg", number_pool_id: null, isExpired: false, expiry_date: "2026-11-01T00:00:00Z", ...n,
});

export const telephonyAccountsSeed = [
  { id: "tel_exotel_mumbai", provider: "exotel", created_at: "2026-07-14T09:20:00Z", owner: "customer", name: "Exotel Mumbai", is_custom_number_enabled: false, is_custom_telephony: false },
  { id: "tel_plivo_acme", provider: "plivo", created_at: "2026-08-02T11:05:00Z", owner: "customer", name: "Acme Plivo", is_custom_number_enabled: false, is_custom_telephony: false },
];

export const numbersSeed: Num[] = [
  num({ id: "num_test_in", number: "+919876540000", created_at: "2026-06-01T09:00:00Z", provider: "plivo", is_test_number: true }),
  num({ id: "num_test_us", number: "+12025550143", created_at: "2026-06-01T09:00:00Z", provider: "plivo", is_test_number: true }),
  num({ id: "num_1201", number: "+919876541201", created_at: "2026-08-12T10:00:00Z", provider: "plivo", number_pool_id: "pool_india_outbound", tags: ["collections"] }),
  num({ id: "num_1202", number: "+919876541202", created_at: "2026-08-12T10:05:00Z", provider: "plivo", number_pool_id: "pool_india_outbound", tags: ["collections"], spam_message: "Flagged as likely spam by carrier reports on 28 Sep 2026." }),
  num({ id: "num_1203", number: "+919876541203", created_at: "2026-07-20T08:30:00Z", provider: "vobiz", agent: { id: "agt_support_line", agent_display_name: "Support line" }, is_inbound_enabled: true, tags: ["support"] }),
  num({ id: "num_1204", number: "+919876541204", created_at: "2026-07-15T12:00:00Z", provider: "exotel", owner: "customer", telephony_id: "tel_exotel_mumbai", number_pool_id: "pool_default", tags: ["Karnataka"] }),
  num({ id: "num_1205", number: "+919876541205", created_at: "2026-07-15T12:02:00Z", provider: "exotel", owner: "customer", telephony_id: "tel_exotel_mumbai", number_pool_id: "pool_default" }),
  num({ id: "num_1206", number: "+919876541206", created_at: "2026-09-03T15:40:00Z", provider: "plivo", owner: "customer", telephony_id: "tel_plivo_acme", number_pool_id: "pool_default", tags: ["renewals"] }),
  num({ id: "num_1207", number: "+919876541207", created_at: "2026-09-10T09:15:00Z", provider: "plivo", number_pool_id: "pool_sales", tags: ["sales"] }),
  num({ id: "num_1208", number: "+919876541208", created_at: "2026-09-10T09:16:00Z", provider: "plivo", number_pool_id: "pool_sales", tags: ["sales"] }),
];

const poolBase = { workspace_id: ws, auto_purchase_telephony_account_id: null, additional_notification_emails: null, active: false, is_default: false, created_at: "2026-08-12T10:10:00Z", updated_at: NOW };
const poolsSeed = [
  { ...poolBase, id: "pool_default", name: "Default pool", description: "Numbers not in any other pool", auto_purchase_enabled: false, auto_purchase_config: null, is_default: true, created_at: "2026-06-01T09:00:00Z" },
  { ...poolBase, id: "pool_india_outbound", name: "India Outbound", description: "Collections campaigns", auto_purchase_enabled: true, auto_purchase_config: { country_code: "IN" } },
  { ...poolBase, id: "pool_sales", name: "Sales callbacks", description: "Lead follow-ups", auto_purchase_enabled: false, auto_purchase_config: { country_code: "IN" }, active: true, created_at: "2026-09-10T09:20:00Z" },
];

/** Numbers for sale on the Buy new tab (number has no "+", as the API returns it). */
const forSale = [
  ["919876543231", "Karnataka"], ["919876543245", "Karnataka"], ["919876543410", "Maharashtra"], ["919876543488", "Maharashtra"],
  ["919876543730", "Delhi"], ["919876543902", "Tamil Nadu"], ["919876543345", "Andhra Pradesh"], ["919876543761", "West Bengal"],
].map(([number, region]) => ({ city: region, number, region, monthly_rental_rate: 499, provider: "plivo", currency: "INR", billing_period_months: 1 }));

/** Numbers on the customer's provider account, for Import your own. */
const owned = [
  { number: "919876541204", provider: "exotel", region: "Karnataka", already_imported: true },
  { number: "919876541205", provider: "exotel", region: "Karnataka", already_imported: true },
  { number: "919876544321", provider: "exotel", region: "Karnataka", already_imported: false },
  { number: "919876544840", provider: "exotel", region: "Maharashtra", already_imported: false },
  { number: "919876544841", provider: "exotel", region: "Maharashtra", already_imported: false },
];

const waNumbers = [
  { phone_number_id: "104857600211", display_phone_number: "+91 98765 40321", verified_name: "Acme Lending", code_verification_status: "VERIFIED", quality_rating: "GREEN", is_registered: true, created_at: "2026-08-20T10:00:00Z" },
  { phone_number_id: "104857600212", display_phone_number: "+91 98765 40322", verified_name: "Acme Lending Collections", code_verification_status: "VERIFIED", quality_rating: "YELLOW", is_registered: true, created_at: "2026-09-04T10:00:00Z" },
];

export function makeNumbersRoutes() {
  const numbers = numbersSeed.map((n) => ({ ...n }));
  const accounts = telephonyAccountsSeed.map((a) => ({ ...a }));
  const pools = poolsSeed.map((p) => ({ ...p }));
  let seq = 0;

  const members = (poolId: string) =>
    numbers.filter((n) => n.number_pool_id === poolId).map((n) => ({ from_number_id: n.id, number: n.number, spam_message: n.spam_message || null, is_spam: !!n.spam_message }));
  const poolOut = (p: (typeof pools)[number]) => {
    const m = members(p.id);
    const spam = m.filter((x) => x.is_spam);
    return { ...p, member_count: m.length, spam_count: spam.length, spam_numbers: spam };
  };
  const detail = (id: string) => {
    const p = pools.find((x) => x.id === id) ?? pools[0];
    return { ...poolOut(p), members: members(p.id) };
  };
  const ok = <T>(data: T) => ({ status: "success", data });
  const addNumber = (raw: string, provider: string, owner: string, telephony_id: string) =>
    numbers.push(num({ id: `num_new_${++seq}`, number: `+${raw}`, created_at: NOW, provider, owner, telephony_id, number_pool_id: "pool_default" }));

  return {
    "GET /workspace/numbers": (url: URL) => {
      const acc = url.searchParams.get("telephony_account_id");
      return { workspace_numbers: acc ? numbers.filter((n) => n.telephony_id === acc) : numbers };
    },
    "GET /payment/numbers": (url: URL) => {
      const region = url.searchParams.get("region");
      const list = forSale.filter((n) => !region || n.region === region).filter((n) => !numbers.some((x) => x.number === `+${n.number}`));
      return { total_count: list.length, limit: 20, offset: 0, numbers: list };
    },
    "POST /payment/number/checkout": (_u: URL, body: any) => {
      addNumber(body.number, body.provider ?? "plivo", body.telephony_account_id ? "customer" : "ringg", body.telephony_account_id ?? "tel_ringg");
      return { message: "Purchase has been completed successfully." };
    },
    "PATCH /workspace/numbers/*/tags": (url: URL, body: any) => {
      const n = numbers.find((x) => x.id === url.pathname.split("/").at(-2));
      if (n && Array.isArray(body?.tags)) n.tags = body.tags;
      return { message: "Tags updated" };
    },

    // Numbers → WhatsApp: one connected WhatsApp Business account with two numbers.
    "GET /whatsapp/embedded-signup/accounts": { accounts: [{ telephony_account_id: "tel_wa_acme", name: "Acme Lending", waba_id: "104857600200", numbers: waNumbers.map((n) => ({ phone_number_id: n.phone_number_id, number: n.display_phone_number })) }] },
    "GET /whatsapp/embedded-signup/*/numbers": { numbers: waNumbers },
    "GET /whatsapp/embedded-signup/provision-number": { provisionings: [] },
    "DELETE /workspace/number/*": { message: "Number removed" },

    "GET /telephony/accounts": (url: URL) => {
      const provider = url.searchParams.get("provider");
      const list = provider ? accounts.filter((a) => a.provider === provider) : accounts;
      return { accounts: list, total: list.length };
    },
    "POST /telephony": (_u: URL, body: any) => {
      const acc = { id: `tel_new_${++seq}`, provider: body.provider, created_at: NOW, owner: "customer", name: body.name, is_custom_number_enabled: false, is_custom_telephony: false };
      accounts.push(acc);
      return acc;
    },
    "DELETE /telephony/*": { message: "Telephony account deleted." },
    "GET /telephony/owned-numbers": () => {
      const list = owned.map((o) => ({ ...o, already_imported: numbers.some((n) => n.number === `+${o.number}`) }));
      return { numbers: list, total: list.length };
    },
    "POST /telephony/import-numbers": (_u: URL, body: any) => {
      const acc = accounts.find((a) => a.id === body.telephony_account_id);
      for (const raw of body.numbers ?? []) addNumber(raw, acc?.provider ?? "exotel", "customer", body.telephony_account_id);
      return { telephony_account_id: body.telephony_account_id, status: "success", message: "Numbers imported" };
    },

    "GET /number-pool": () => ok({ pools: pools.map(poolOut), limit: 20, offset: 0, count: pools.length }),
    "GET /number-pool/*": (url: URL) => ok(detail(url.pathname.split("/").pop()!)),
    "POST /number-pool": (_u: URL, body: any) => {
      const id = `3f6a2c1e-8b4d-4e7a-9c2f-${String(++seq).padStart(12, "0")}`;
      pools.push({ ...poolBase, id, name: body.name, description: body.description ?? null, auto_purchase_enabled: !!body.auto_purchase_enabled, auto_purchase_config: body.auto_purchase_config ?? null, created_at: NOW });
      for (const nid of body.from_number_ids ?? []) {
        const n = numbers.find((x) => x.id === nid);
        if (n) n.number_pool_id = id;
      }
      return ok(detail(id));
    },
    "PATCH /number-pool/*": (url: URL, body: any) => {
      const p = pools.find((x) => x.id === url.pathname.split("/").pop());
      if (p) Object.assign(p, body);
      return ok(detail(p?.id ?? "pool_default"));
    },
    "POST /number-pool/*/members": (url: URL, body: any) => {
      const id = url.pathname.split("/").at(-2)!;
      for (const nid of body.from_number_ids ?? []) {
        const n = numbers.find((x) => x.id === nid);
        if (n) n.number_pool_id = id;
      }
      return ok(detail(id));
    },
    "DELETE /number-pool/*/members": (url: URL) => ok(detail(url.pathname.split("/").at(-2)!)),
    "DELETE /number-pool/*": (url: URL) => ok({ id: url.pathname.split("/").pop(), archived: true, migrated_to_default_pool_id: "pool_default", migrated_count: 0 }),
  };
}

/** Provider logos come from Brandfetch, which refuses localhost; block it so the UI shows its own fallback. */
export async function showProviderLogos(page: import("@playwright/test").Page) {
  await page.context().route("https://cdn.brandfetch.io/**", (route) => route.abort());
}
