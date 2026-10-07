// Parrot STT (Labs → STT) fixtures: try-it transcription, request logs, usage analytics.
// Shapes follow types/stt.types.ts and lib/api/stt.api.ts in the dashboard.
// The try-it upload posts to the STT data plane (<backend origin>/stt/v1/transcriptions), not /api/backend,
// so scenarios answer it with `routeSttTranscribe(page)`; everything else goes through the route map.
import type { Page } from "@playwright/test";
import { apiKeyRoutes } from "./account.ts";
import { NOW } from "./common.ts";

/** Obviously fictional Acme Lending text: what the stubbed model "heard" in the uploaded sample. */
export const SAMPLE_TRANSCRIPT = "Hello, this is Priya from Acme Lending. Your EMI of twelve thousand five hundred rupees is due on the fifth of October. Would you like to pay now, or should I schedule a callback for tomorrow?";

export const transcribeResponse = {
  status: "success",
  transcription: SAMPLE_TRANSCRIPT,
  is_final: true,
  language: "en",
  duration_seconds: 6.2,
  processing_time_seconds: 0.84,
  request_id: "7f3c2a9e-5b1d-4e8a-9c6f-acme00000012",
};

const minutesAgo = (m: number) => new Date(Date.parse(NOW) - m * 60_000).toISOString();

const logs = [
  { request_id: "7f3c2a9e-5b1d-4e8a-9c6f-acme00000012", at: 0, duration: "6.2", mode: "rest", credits: "0.05", status: "DONE" },
  { request_id: "2b8e41d7-0c3a-4f5e-8a1b-acme00000011", at: 14, duration: "47.8", mode: "stream", credits: "0.40", status: "DONE" },
  { request_id: "c91d6f20-7e4b-4a2c-b3d8-acme00000010", at: 38, duration: "128.5", mode: "on_final", credits: "1.07", status: "DONE" },
  { request_id: "5a7e9c13-2d6f-4b8a-9e0c-acme00000009", at: 61, duration: null, mode: "stream", credits: null, status: "INITIATED" },
  { request_id: "e3f8b2a6-9c1d-4e7f-a5b4-acme00000008", at: 95, duration: "3.1", mode: "rest", credits: null, status: "FAILED" },
  { request_id: "8d2c7f41-6a3e-4d9b-8c7a-acme00000007", at: 140, duration: "212.0", mode: "stream", credits: "1.77", status: "DONE" },
  { request_id: "1c6b9e58-3f2a-4c1d-9b6e-acme00000006", at: 260, duration: "19.4", mode: "rest", credits: "0.16", status: "DONE" },
  { request_id: "9e4a1d73-8b5c-4f6e-a2d1-acme00000005", at: 410, duration: "356.9", mode: "on_final", credits: "2.97", status: "DONE" },
  { request_id: "4b7d2e96-1a8f-4e3c-b9a7-acme00000004", at: 1380, duration: "64.3", mode: "stream", credits: "0.54", status: "DONE" },
  { request_id: "6f1e8c24-5d9b-4a7e-8f3c-acme00000003", at: 2900, duration: "91.7", mode: "stream", credits: "0.76", status: "DONE" },
].map((l) => ({ request_id: l.request_id, timestamp: minutesAgo(l.at), duration_seconds: l.duration, mode: l.mode, credits_charged: l.credits, currency: l.credits ? "INR" : null, status: l.status }));

const detailOf = (item: (typeof logs)[number]) => ({
  ...item,
  workspace_id: "ws_demo",
  error_message: item.status === "FAILED" ? "Unsupported sample rate: 44100 Hz with encoding int32 (expected 8000-48000 Hz mono PCM)" : null,
  metadata: {
    params: { language: "en", mode: item.mode, enable_cap_punc: true, sample_rate: item.mode === "rest" ? null : 16000, encoding: item.mode === "rest" ? null : "int16", vad_tail_sil_ms: item.mode === "rest" ? null : 200, vad_confidence: item.mode === "rest" ? null : 0.55 },
    latency_matrix: { audio_duration_sec: item.duration_seconds ? Number(item.duration_seconds) : null, transcribed_audio_duration_sec: item.duration_seconds ? Number(item.duration_seconds) : null, compute_latency_ms: 412, processing_time_ms: 843, segments: item.mode === "rest" ? 1 : 9 },
  },
  created_at: item.timestamp,
  updated_at: minutesAgo(0),
});

const dailySeries = [1.9, 2.4, 2.1, 3.6, 4.2, 3.8, 0.6, 1.1, 5.4, 6.8, 6.1, 7.3, 8.9, 7.7].map((credits, i) => ({
  date: new Date(Date.parse(NOW) - (13 - i) * 86_400_000).toISOString().slice(0, 10),
  credits: credits.toFixed(2),
}));

export function sttRoutes() {
  return {
    ...apiKeyRoutes(),
    "GET /ringg-labs/stt/logs": (url: URL) => {
      const status = url.searchParams.get("status");
      const mode = url.searchParams.get("mode");
      const items = logs.filter((l) => (!status || l.status === status) && (!mode || l.mode === mode));
      return { items, total: items.length, page: 1, page_size: 50 };
    },
    "GET /ringg-labs/stt/logs/*": (url: URL) => detailOf(logs.find((l) => l.request_id === url.pathname.split("/").pop()) ?? logs[0]),
    "GET /ringg-labs/stt/analytics/summary": {
      total_requests: { value: "1284", delta_this_week: "212" },
      audio_processed_seconds: { value: "93840", delta_this_week_seconds: "14520" },
      credits_used: { value: "782.00", delta_this_week: "121.00", currency: "INR" },
    },
    "GET /ringg-labs/stt/analytics/daily-usage": { days: 14, currency: "INR", series: dailySeries },
  };
}

/** Answers the try-it upload wherever the build points its STT data plane. */
export async function routeSttTranscribe(page: Page, delayMs = 900) {
  await page.context().route("**/stt/v1/transcriptions", async (route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(transcribeResponse) });
  });
}
