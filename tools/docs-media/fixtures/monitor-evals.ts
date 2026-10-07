// Evals fixtures: agent summary, per-metric trend, top issues, test cases with runs, metric settings.
import { agentRoutes } from "./agents.ts";

const metrics = [
  { metric_id: "met_hallucination", metric_name: "hallucination" },
  { metric_id: "met_instruction_following", metric_name: "instruction_following" },
  { metric_id: "met_knowledge_gap", metric_name: "knowledge_gap" },
  { metric_id: "met_tool_accuracy", metric_name: "tool_accuracy" },
  { metric_id: "met_callback_offer", metric_name: "offered_callback" },
];
const base: Record<string, number> = { met_hallucination: 0.95, met_instruction_following: 0.86, met_knowledge_gap: 0.9, met_tool_accuracy: 0.93, met_callback_offer: 0.81 };
const noise = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function trend(url: URL) {
  const start = new Date((url.searchParams.get("start_date") ?? "2026-09-07").slice(0, 10) + "T00:00:00Z");
  const end = new Date((url.searchParams.get("end_date") ?? "2026-10-07").slice(0, 10) + "T00:00:00Z");
  const dates: string[] = [];
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) dates.push(d.toISOString().slice(0, 10));
  return {
    series: metrics.map((m, k) => ({
      metric_id: m.metric_id,
      metric_name: m.metric_name,
      // A prompt fix on 24 Sep lifts instruction following.
      points: dates.map((date, i) => ({
        date,
        avg_score: Math.min(1, Math.max(0, base[m.metric_id] - (m.metric_id === "met_instruction_following" && date < "2026-09-24" ? 0.12 : 0) + (noise(i, k + 1) - 0.5) * 0.08)),
        evaluated_calls: 90 + Math.round(noise(i, k + 7) * 60),
      })),
    })),
  };
}

const summary = {
  agents: [
    { agent_id: "agt_payment_reminder", agent_display_name: "Payment reminder", overall_score: 0.89, evaluated_calls: 3412, metrics: metrics.map((m) => ({ ...m, avg_score: base[m.metric_id], evaluated_calls: 3412 })) },
    { agent_id: "agt_support_line", agent_display_name: "Support line", overall_score: 0.91, evaluated_calls: 1688, metrics: metrics.slice(0, 4).map((m) => ({ ...m, avg_score: base[m.metric_id] + 0.02, evaluated_calls: 1688 })) },
  ],
};

const issues = {
  issues: [
    {
      metric_id: "met_instruction_following", metric_name: "instruction_following", issue_key: "instruction_following", occurrences: 238,
      examples: [{ customer: "Can you just waive the late fee this one time?", assistant: "Sure, I have waived the late fee for you.", detail: "Agreed to waive a fee, which the prompt says it must never do." }],
    },
    {
      metric_id: "met_knowledge_gap", metric_name: "knowledge_gap", issue_key: "knowledge_gap", occurrences: 171,
      examples: [{ customer: "Can I pay part of the EMI now and the rest next week?", assistant: "I'm not sure about part payments. Please contact the branch.", detail: "Part-payment policy is missing from the knowledge base." }],
    },
    {
      metric_id: "met_tool_accuracy", metric_name: "tool_accuracy", issue_key: "tool_accuracy", occurrences: 96,
      examples: [{ customer: "Send the payment link on the 12th, please.", assistant: "Done, the link is scheduled for today.", detail: "Called schedule_payment_link with today's date instead of the 12th." }],
    },
  ],
};

const tc = (id: string, name: string, script: string, outcome: string, channel = "voice") => ({
  id, workspace_id: "ws_demo", agent_id: "agt_payment_reminder", name, source_type: "generated", script, expected_outcome_prompt: outcome,
  status: "ready", run_simulation: true, channel, created_at: "2026-09-20T09:00:00Z", updated_at: "2026-10-05T09:00:00Z",
});
export const testCases = [
  tc("evl_01", "Customer asks to waive the late fee", "<p>The customer is two days late and repeatedly asks the agent to waive the ₹500 late fee.</p>", "The agent politely refuses to waive the fee and offers a payment link."),
  tc("evl_02", "Wrong person answers", "<p>The customer's brother answers and offers to pass on a message.</p>", "The agent does not disclose loan details and asks for a better time to reach the customer."),
  tc("evl_03", "Promises to pay on salary day", "<p>The customer says they will pay after their salary arrives on the 8th.</p>", "The agent records the promised date and offers to send a payment link that day."),
  tc("evl_04", "Asks for part payment", "<p>The customer wants to pay half the EMI now and the rest next week.</p>", "The agent explains the part-payment policy correctly."),
  tc("evl_05", "Already paid yesterday", "<p>The customer says they paid by UPI yesterday and is annoyed by the call.</p>", "The agent apologises, notes the payment and ends the call politely."),
  tc("evl_06", "Switches to Hindi mid-call", "<p>The customer starts in English and switches to Hindi after the first question.</p>", "The agent continues the conversation in Hindi."),
  tc("evl_07", "Requests a callback in the evening", "<p>The customer is driving and asks to be called after 7 PM.</p>", "The agent schedules a callback after 7 PM and ends the call.", "web_chat"),
  tc("evl_08", "Disputes the EMI amount", "<p>The customer says the EMI should be ₹11,800, not ₹12,450.</p>", "The agent states the correct amount from the call variables and offers to raise a ticket."),
];
const verdicts: Record<string, boolean | null> = { evl_01: true, evl_02: true, evl_03: true, evl_04: false, evl_05: true, evl_06: true, evl_07: null, evl_08: true };

const runOf = (id: string) => ({
  id: `run_${id}`, evaluator_id: id, call_id: `sim_${id}`, agent_version_id: "a3f9c2e1-7d4b-4e8a-9c2f-5b1e8d7a3c60", status: "completed", success_criteria_met: verdicts[id],
  error_message: null, created_at: "2026-10-05T09:30:00Z", started_at: "2026-10-05T09:30:05Z", completed_at: "2026-10-05T09:31:12Z",
});

const runDetail = (runId: string) => {
  const id = runId.replace("run_", "");
  const t = testCases.find((x) => x.id === id) ?? testCases[0];
  const met = verdicts[id];
  return {
    ...runOf(id),
    agent_version_created_at: "2026-10-02T08:00:00Z",
    evaluator_name: t.name,
    recording_url: null,
    call_duration: 58,
    success_criteria_details: {
      reasoning: met ? "The agent refused to waive the late fee twice, explained why, and offered to send a UPI link." : "The agent said part payments are not possible, but the policy allows one part payment per quarter.",
      criteria_results: met
        ? [
            { criterion: "Refuses to waive the late fee", status: "met", reason: "Said the fee cannot be waived as per policy." },
            { criterion: "Stays polite under pressure", status: "met", reason: "Kept a calm, respectful tone." },
            { criterion: "Offers a payment link", status: "met", reason: "Offered a UPI link on WhatsApp." },
          ]
        : [
            { criterion: "Explains the part-payment policy correctly", status: "not_met", reason: "Stated part payments are not allowed." },
            { criterion: "Offers a next step", status: "met", reason: "Offered a callback from the branch." },
          ],
    },
    transcript: [
      { bot: "Hello, am I speaking with Rahul Verma?", timestamp: "2026-10-05T09:30:06Z" },
      { user: "Yes. Look, I know I'm late, but can you waive the late fee this once?", timestamp: "2026-10-05T09:30:10Z" },
      { bot: "I understand, Rahul. I'm sorry, the late fee can't be waived, but paying today stops any further charges. Shall I send a UPI link on WhatsApp?", timestamp: "2026-10-05T09:30:16Z" },
      { user: "Fine, send it.", timestamp: "2026-10-05T09:30:27Z" },
      { bot: "Done. You'll get the link in a minute. Thank you, Rahul.", timestamp: "2026-10-05T09:30:30Z" },
    ],
  };
};

export const evalsRoutes = {
  ...agentRoutes,
  "GET /evals/observability/agents-summary": summary,
  "GET /evals/observability/enabled-agents": { agents: summary.agents.map((a) => ({ agent_id: a.agent_id, agent_display_name: a.agent_display_name, metrics: a.metrics.map(({ metric_id, metric_name }) => ({ metric_id, metric_name })) })), count: 2 },
  "GET /evals/agents/*/observability/trend": (url: URL) => trend(url),
  "GET /evals/agents/*/observability/top-issues": issues,
  "GET /evals/agents/*/observability/metrics": {
    count: metrics.length,
    metrics: metrics.map((m) => ({ metric_id: m.metric_id, metric_name: m.metric_name, is_active: true, is_system: m.metric_id !== "met_callback_offer", evaluation_prompt: m.metric_id === "met_callback_offer" ? "Did the agent offer to call back at a better time when the customer said they were busy?" : null, tolerance: "balanced", created_at: "2026-09-01T10:00:00Z" })),
  },
  "GET /evals/agents/*/customer-voice": { customer_voice_id: null },
  "GET /v1/voices": { voices: [] },
  "GET /evals/evaluators": () => ({ evaluators: testCases, count: testCases.length }),
  // Write a prompt → Add test case: the new case joins the list as Never run.
  "POST /evals/evaluators": (_url: URL, body: any) => {
    const created = { ...tc(`evl_${String(testCases.length + 1).padStart(2, "0")}`, body?.name ?? "New test case", `<p>${body?.script ?? ""}</p>`, body?.expected_outcome_prompt ?? "", body?.channel ?? "voice"), source_type: body?.source_type ?? "manual", created_at: new Date().toISOString() };
    testCases.unshift(created);
    return created;
  },
  "PATCH /evals/agents/*/observability/metrics/*/tolerance": (url: URL, body: any) => {
    const id = url.pathname.split("/").at(-2);
    const list = (evalsRoutes["GET /evals/agents/*/observability/metrics"] as { metrics: { metric_id: string; tolerance: string }[] }).metrics;
    for (const m of list) if (m.metric_id === id) m.tolerance = body?.tolerance ?? m.tolerance;
    return evalsRoutes["GET /evals/agents/*/observability/metrics"];
  },
  "GET /evals/runs": (url: URL) => {
    const id = url.searchParams.get("evaluator_id") ?? "evl_01";
    return id in verdicts ? { runs: [runOf(id)], count: 1 } : { runs: [], count: 0 };
  },
  "GET /evals/runs/*": (url: URL) => runDetail(url.pathname.split("/").at(-1)!),
  "GET /tools/call-logs/*": [],
  "POST /evals/evaluators/run-all": { run_ids: testCases.map((t) => `run_${t.id}`), triggered: testCases.length, message: "Runs queued" },
};
