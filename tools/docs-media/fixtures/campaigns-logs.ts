// Logs filtered to one campaign (/logs?bulk_list_id=...): the calls of "EMI reminders – week 41".
// Shape: GetHistoryResponse / CallingHistoryItem in the dashboard's lib/api/history.api.ts and types/history.types.ts.
const people: [string, string][] = [
  ["Rahul Verma", "+919876543210"],
  ["Ananya Iyer", "+919876541122"],
  ["Vikram Nair", "+919876543345"],
  ["Sneha Kulkarni", "+919876547781"],
  ["Arjun Mehta", "+919876540093"],
  ["Rohan Desai", "+919876542267"],
  ["Meera Pillai", "+919876548834"],
  ["Aditya Joshi", "+919876546619"],
  ["Fatima Sheikh", "+919876544458"],
  ["Karan Malhotra", "+919876541907"],
  ["Pooja Bhatt", "+919876545530"],
  ["Siddharth Rao", "+919876549012"],
];
const statuses = ["ongoing", "completed", "retry", "completed", "failed", "completed", "completed", "retry", "completed", "completed", "completed", "completed"] as const;
const durations = [0, 141, 0, 73, 0, 118, 66, 0, 152, 87, 94, 109];

export function campaignCalls(bulkListId: string) {
  const base = Date.now() - 5 * 60_000;
  return people.map(([name, to], i) => {
    const at = new Date(base - i * 4 * 60_000).toISOString();
    const status = statuses[i];
    return {
      id: `call_${bulkListId}_${String(i + 1).padStart(3, "0")}`,
      name,
      to_number: to,
      call_cost: durations[i] ? Math.round(durations[i] * 0.09 * 100) / 100 : 0,
      currency: "INR",
      created_at: at,
      transcript: "",
      audio_recording: durations[i] ? "https://files.example.com/acme-lending/recording.mp3" : null,
      call_duration: durations[i],
      call_type: "outbound",
      call_attempt_time: at,
      credits_processed: status === "completed",
      inbound_from: null,
      agent: { id: "agt_payment_reminder", agent_name: "Payment reminder", orchestration_mode: "single_node", version: { version_id: "ver_pr_3", version_slug: "v3" } },
      from_numbers: ["+919876543210"],
      voicemail_detected: false,
      bulk_list_id: bulkListId,
      status,
      next_attempt_time: status === "retry" ? new Date(Date.now() + 30 * 60_000).toISOString() : null,
      is_callback: false,
      has_call_attempts: status === "retry",
    };
  });
}

export const campaignLogsRoutes = {
  "GET /calling/history/v2": (url: URL) => {
    const id = url.searchParams.get("bulk_list_id") ?? "cmp_emi_week41";
    const calls = campaignCalls(id);
    return { limit: 100, count: calls.length, total: calls.length, offset: 0, calls };
  },
};
