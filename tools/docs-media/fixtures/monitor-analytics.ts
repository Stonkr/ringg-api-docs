// Analytics fixtures (analytics/v4): volume cards and series, connectivity, performance, cohorts, call limits, concurrency.
// Plausible numbers for Acme Lending's month. Scoped requests (an agent picked) return a smaller slice.
import { logsRoutes } from "./monitor.ts";

// Deterministic 0..1 noise so every run renders the same charts.
const noise = (i: number, seed = 1) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const isScoped = (url: URL) => !!(url.searchParams.get("agent_id") || url.searchParams.get("bulk_list_id"));
const scaleOf = (url: URL) => (url.searchParams.get("bulk_list_id") ? 0.67 : isScoped(url) ? 0.58 : 1);

function days(url: URL) {
  const start = url.searchParams.get("start_date") ?? "2026-09-06";
  const end = url.searchParams.get("end_date") ?? "2026-10-06";
  const out: string[] = [];
  for (let d = new Date(start + "T00:00:00Z"); d <= new Date(end + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}

function buckets(url: URL) {
  const k = scaleOf(url);
  const all = days(url);
  // A campaign scope (bulk_list_id) only has calls on its last two days, the days the campaign ran.
  const campaignFrom = url.searchParams.get("bulk_list_id") ? all[Math.max(0, all.length - 2)] : "";
  return all.map((bucket, i) => {
    const weekday = new Date(bucket + "T00:00:00Z").getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.45 : 1;
    // A campaign push from 1 Oct lifts volume.
    const push = bucket >= "2026-10-01" ? 1.35 : 1;
    const total = bucket < campaignFrom ? 0 : Math.round((320 + noise(i) * 140) * (campaignFrom ? 1 : weekend) * push * k);
    const completed = Math.round(total * (0.58 + noise(i, 2) * 0.1));
    const failed = Math.round(total * (0.22 + noise(i, 3) * 0.06));
    const cancelled = Math.round(total * 0.03);
    const registered = bucket === "2026-10-06" ? Math.round(total * 0.06) : 0;
    const ongoing = bucket === "2026-10-06" ? 4 : 0;
    const retry = Math.max(0, total - completed - failed - cancelled - registered - ongoing);
    return { bucket, total, attempted: total - registered, completed, failed, cancelled, registered, ongoing, retry };
  });
}

const md = (count: number, delta: number | null, prevRatio = 0.9) => ({ count, previous: Math.round(count * prevRatio * 100) / 100, delta_pct: delta });

function volume(url: URL) {
  const b = buckets(url);
  const sum = (key: keyof (typeof b)[number]) => b.reduce((n, x) => n + (x[key] as number), 0);
  const total = sum("total"), connected = sum("completed"), k = scaleOf(url);
  const aht = 96;
  return {
    volume: {
      total: { ...md(total, 12.4), campaign_count: Math.round(total * 0.82), api_count: total - Math.round(total * 0.82) },
      callback_count: md(Math.round(total * 0.04), 3.1),
      registered: md(sum("registered"), -8.2),
      ongoing: md(sum("ongoing"), null),
      retry: md(sum("retry"), -4.6),
      not_dialed: md(Math.round(41 * k), -12),
      attempted: md(sum("attempted"), 11.8),
      attempts_incl_retries: md(Math.round(sum("attempted") * 1.31), 10.2),
      connected: md(connected, 15.7),
      failed: md(sum("failed"), -3.9),
      cancelled: md(sum("cancelled"), 1.2),
      connection_rate: { ...md(Math.round((connected / total) * 1000) / 1000, 2.9), campaign_time_exhausted: Math.round(118 * k), retry_exhausted: Math.round(406 * k) },
      voicemail: md(Math.round(total * 0.06), -6.5),
      aht_seconds: { ...md(aht, 4.3), duration_distribution: { "0_10": Math.round(connected * 0.09), "10_30": Math.round(connected * 0.17), "30_60": Math.round(connected * 0.31), "60_plus": connected - Math.round(connected * 0.57) } },
      total_minutes: md(Math.round((connected * aht) / 60), 19.6),
      unique_numbers_used: md(isScoped(url) ? 3 : 6, 0),
      chat_total: md(0, null),
      total_interactions: md(total, 12.4),
      by_bucket: b,
    },
  };
}

function connectivity(url: URL) {
  const b = buckets(url);
  const total = b.reduce((n, x) => n + x.total, 0);
  const a1 = Math.round(total * 0.44), a2 = Math.round(total * 0.12), a3 = Math.round(total * 0.06);
  return { connectivity: { total, connected: a1 + a2 + a3, connectivity_pct: Math.round(((a1 + a2 + a3) / total) * 10000) / 100, by_retry_attempt: { attempt_1: a1, attempt_2: a2, attempt_3: a3 } } };
}

const assistants = [
  { agent_id: "agt_payment_reminder", agent_name: "Payment reminder", call_count: 6214, total_connected: 3871, total_minutes: 5412, cost: 35178 },
  { agent_id: "agt_support_line", agent_name: "Support line", call_count: 1986, total_connected: 1902, total_minutes: 5530, cost: 35945 },
  { agent_id: "agt_lead_callback", agent_name: "Lead qualification", call_count: 1204, total_connected: 688, total_minutes: 1890, cost: 12285 },
  { agent_id: "agt_website", agent_name: "Website assistant", call_count: 512, total_connected: 509, total_minutes: 1420, cost: 9230 },
  { agent_id: "agt_loan_flow", agent_name: "Loan application flow", call_count: 238, total_connected: 131, total_minutes: 486, cost: 3159 },
];

function performance(url: URL) {
  const agentIds = url.searchParams.get("agent_id")?.split(",") ?? (url.searchParams.get("bulk_list_id") ? ["agt_payment_reminder"] : []);
  let rows = agentIds.length ? assistants.filter((a) => agentIds.includes(a.agent_id)) : assistants;
  if (url.searchParams.get("bulk_list_id")) {
    // Campaign scope: the one agent's figures for the campaign's calls only.
    const b = buckets(url);
    const calls = b.reduce((n, x) => n + x.total, 0), connected = b.reduce((n, x) => n + x.completed, 0);
    rows = rows.map((a) => ({ ...a, call_count: calls, total_connected: connected, total_minutes: Math.round((connected * 87) / 60), cost: Math.round(((connected * 87) / 60) * 6.5) }));
  }
  const totalCost = rows.reduce((n, a) => n + a.cost, 0);
  const goal = isScoped(url) ? 0.47 : null;
  return {
    summary: { goal_rate: goal, avg_latency_ms: 842, total_cost: totalCost, cost_per_outcome: goal ? Math.round((totalCost / (rows[0].total_connected * goal)) * 100) / 100 : null },
    currency: "INR",
    assistants_in_action: rows,
  };
}

const reserved = [{ path: "general_analysis", key: "classification", label: "Classification", type: "enum", values: ["Promise to pay", "Already paid", "Callback requested", "Refused to pay", "Wrong number"] }];
const clientDims = [
  { path: "client_analysis", key: "payment_promised", label: "Payment promised", type: "boolean" },
  { path: "client_analysis", key: "payment_mode", label: "Payment mode", type: "enum" },
];

const breakdowns: Record<string, [string, number][]> = {
  classification: [["Promise to pay", 1820], ["Already paid", 912], ["Callback requested", 604], ["Refused to pay", 298], ["Wrong number", 141], ["N/A", 96]],
  payment_promised: [["true", 1822], ["false", 1953], ["N/A", 96]],
  payment_mode: [["UPI", 1104], ["Net banking", 402], ["Debit card", 211], ["Branch visit", 105], ["N/A", 2049]],
};

export const analyticsRoutes = {
  ...logsRoutes,
  "GET /analytics/v4/volume-graph": (url: URL) => volume(url),
  "GET /analytics/v4/connectivity": (url: URL) => connectivity(url),
  "GET /analytics/v4/agent-performance": (url: URL) => performance(url),
  "GET /analytics/v4/cohort/dimensions": (url: URL) => ({ reserved, client_analysis: url.searchParams.get("agent_id") ? clientDims : [] }),
  "GET /analytics/v4/cohort/breakdown": (url: URL) => {
    const key = url.searchParams.get("key") ?? "classification";
    return {
      path: url.searchParams.get("path"),
      key,
      breakdown: (breakdowns[key] ?? []).map(([value, connected]) => ({ value, calls: Math.round(connected * 1.3), connected, connection_rate: 0.77, goal_rate: null, aht_seconds: 80 + (connected % 40) })),
    };
  },
  "GET /analytics/v3/call-frequency-analytics": { status: "success", waiting: 37, cancelled_by_limit: 12, cancelled_while_waiting: 5, dialled_after_waiting: 214 },
  "GET /analytics/v4/concurrency-trend": (url: URL) => ({
    granularity: "day",
    available: true,
    series: days(url).map((d, i) => ({ bucket: `${d} 00:00:00`, paid: 20, received: Math.min(20, Math.round(9 + noise(i, 5) * 8 + (d >= "2026-10-01" ? 4 : 0))) })),
  }),
};
