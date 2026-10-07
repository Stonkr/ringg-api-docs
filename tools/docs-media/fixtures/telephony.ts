// Telephony area fixtures: SIP trunks for an enterprise workspace (Numbers → Add number → SIP → Configure SIP Trunks).
// Shapes follow types/sip-trunk.types.ts, lib/api/sip-trunk.api.ts and types/byot.types.ts in the dashboard.
// Builds on makeNumbersRoutes(); the SIP provider ("kamailio") only shows for is_enterprise workspaces.
import { NOW, workspace } from "./common.ts";
import { makeNumbersRoutes, telephonyAccountsSeed } from "./numbers.ts";

const enterpriseWorkspace = { ...workspace, is_enterprise: true };

type SipTrunk = {
  id: string; name: string; created_at: string;
  sip: { direction: "inbound" | "outbound" | "both"; transport: "udp" | "tcp" | "tls"; display_name: string; trunk_name: string; trunk_id: number; inbound_sources: string[] | null; outbound_target: string | null; tech_prefix: string | null; outbound_strip_digits: number | null; auth: Record<string, unknown> | null };
};

/** One trunk already connected, so Configure SIP Trunks opens on its list (with Add) instead of the empty-state form. */
const trunksSeed: SipTrunk[] = [
  {
    id: "tel_sip_genesys_pune", name: "Genesys Cloud Pune", created_at: "2026-08-18T07:45:00Z",
    sip: { direction: "inbound", transport: "udp", display_name: "Genesys Cloud Pune", trunk_name: "acme_genesys_pune", trunk_id: 4102, inbound_sources: ["198.51.100.0/28"], outbound_target: null, tech_prefix: null, outbound_strip_digits: null, auth: null },
  },
];

export function makeTelephonyRoutes() {
  const base = makeNumbersRoutes();
  const trunks = trunksSeed.map((t) => ({ ...t }));
  const customNumbers: Array<Record<string, unknown> & { telephony_id: string }> = [];
  let seq = 0;
  const asAccount = (t: SipTrunk) => ({ id: t.id, provider: "kamailio", created_at: t.created_at, owner: "customer", name: t.name, is_custom_number_enabled: true, is_custom_telephony: false });

  return {
    ...base,
    "GET /workspace": { workspace_info: enterpriseWorkspace },
    "GET /workspace/all": { workspaces: [enterpriseWorkspace] },
    "GET /telephony/accounts": (url: URL) => {
      const provider = url.searchParams.get("provider");
      const all = [...telephonyAccountsSeed, ...trunks.map(asAccount)];
      const list = provider ? all.filter((a) => a.provider === provider) : all;
      return { accounts: list, total: list.length };
    },
    "POST /telephony/sip-trunk": (_u: URL, body: any) => {
      const id = `tel_sip_new_${++seq}`;
      trunks.push({
        id, name: body.display_name, created_at: NOW,
        sip: { direction: body.direction, transport: body.transport ?? "udp", display_name: body.display_name, trunk_name: `acme_${id}`, trunk_id: 4200 + seq, inbound_sources: body.inbound_sources ?? null, outbound_target: body.outbound_target ?? null, tech_prefix: body.tech_prefix ?? null, outbound_strip_digits: body.outbound_strip_digits ?? null, auth: body.auth ?? null },
      });
      return { message: "SIP trunk created successfully." };
    },
    "GET /telephony/sip-trunk/*": (url: URL) => {
      const t = trunks.find((x) => x.id === url.pathname.split("/").pop()) ?? trunks[0];
      return { id: t.id, name: t.name, owner: "customer", provider: "kamailio", created_at: t.created_at, updated_at: NOW, sip: t.sip };
    },
    "PATCH /telephony/sip-trunk/*": { message: "SIP trunk updated successfully." },
    "DELETE /telephony/sip-trunk/*": { message: "SIP trunk deleted." },
    "GET /workspace/numbers": (url: URL) => {
      const { workspace_numbers } = (base["GET /workspace/numbers"] as (u: URL) => { workspace_numbers: unknown[] })(url);
      const acc = url.searchParams.get("telephony_account_id");
      return { workspace_numbers: [...workspace_numbers, ...customNumbers.filter((n) => !acc || n.telephony_id === acc)] };
    },
    "PATCH /telephony/manage-numbers": (_u: URL, body: any) => {
      for (const raw of body.from_number ?? []) {
        customNumbers.push({
          id: `num_sip_${++seq}`, number: raw.startsWith("+") ? raw : `+${raw}`, created_at: NOW, agent: null, is_inbound_enabled: false, is_test_number: false, spam_message: "", tags: [],
          is_custom_number: true, owner: "customer", telephony_id: body.telephony_id, provider: "kamailio", number_pool_id: "pool_default", isExpired: false, expiry_date: "2026-11-01T00:00:00Z",
        });
      }
      return { message: "Numbers have been added successfully." };
    },
  };
}
