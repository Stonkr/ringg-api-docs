import { type BrowserContext, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { shellRoutes } from "./fixtures/common.ts";

/** Scratch output (raw frames, logs, timelines) lives in the system temp folder, never in the repo. */
export const OUT = join(tmpdir(), "ringg-docs-media");
mkdirSync(OUT, { recursive: true });

export const BASE = process.env.DASHBOARD_URL ?? "http://localhost:3201/dashboard";

export type RouteMap = Record<string, unknown | ((url: URL, body: unknown) => unknown)>;

/** Seeds a signed-in session and answers every backend call from the route map (unknown calls get `{}` and are logged). */
export async function prepareContext(context: BrowserContext, routes: RouteMap, logFile = join(OUT, "unmatched.log")) {
  await context.addInitScript(() => {
    const state = { token: "cookie-session", sessionExpiresAt: Date.now() + 86_400_000, activeWorkspaceId: "ws_demo", lastActiveWorkspaceId: "ws_demo" };
    localStorage.setItem("_ringg_user", JSON.stringify({ state, version: 2 }));
  });
  const all: RouteMap = { ...shellRoutes, ...routes };
  await context.route(/\/api\/backend\/.*/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/api\/backend/, "");
    const key = `${req.method()} ${path}`;
    const match = all[key] ?? Object.entries(all).find(([k]) => k.includes("*") && new RegExp(`^${k.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]+")}$`).test(key))?.[1];
    if (match === undefined) appendFileSync(logFile, `${key}${url.search}\n`);
    let body: unknown = {};
    if (typeof match === "function") {
      let reqBody: unknown = undefined;
      try { reqBody = req.postDataJSON(); } catch { reqBody = req.postData(); }
      body = await (match as (u: URL, b: unknown) => unknown)(url, reqBody);
    } else if (match !== undefined) body = match;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

/** Hides UI that should never appear in docs media (support widgets, toasts from stubbed saves, coachmarks). */
export async function cleanPage(page: Page) {
  await page.addStyleTag({ content: `[data-sonner-toaster], [data-slot="toast-region"], [data-toast], [role="region"][aria-label*="otification" i], #crisp-chatbox, iframe[title*="chat" i] { display: none !important; }` }).catch(() => {});
}

export async function gotoDashboard(page: Page, route: string) {
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await cleanPage(page);
}

/** Writes an image buffer as WebP: lossless for screenshots (UI text stays exact), quality 85 for posters. Playwright and this ffmpeg can't write WebP, so Pillow encodes it. */
export function saveWebp(image: Buffer, path: string, lossless = true) {
  const py = "import io,sys;from PIL import Image;im=Image.open(io.BytesIO(sys.stdin.buffer.read()));im.save(sys.argv[1],'WEBP',method=6,**({'lossless':True,'quality':100} if sys.argv[2]=='1' else {'quality':85}))";
  execFileSync("python3", ["-c", py, path, lossless ? "1" : "0"], { input: image });
}

// ── Ringg Analytics (analytics.ringg.ai) ─────────────────────────────
// A separate app with its own API under /an/api/v0 and its own login. Its
// fixtures are recorded once from a server holding only fictional data
// (ANALYTICS_RECORD_API), then replayed: fixtures/analytics/<scenario>.json.

export const ANALYTICS_BASE = process.env.ANALYTICS_URL ?? "http://localhost:3202";
const ANALYTICS_FIXTURES = join(import.meta.dirname, "fixtures", "analytics");

/** Who the scenario signs in as (a user key in the recording's token file) and its fixture file. */
export interface AnalyticsSession {
  as: string;
  fixture: string;
}

interface Recorded { method: string; path: string; query: string; phase: number; status: number; body: unknown }

// Dates change every day, so they never decide which recorded response answers.
const IGNORED_QUERY = ["date_from", "date_to"];
const normQuery = (url: URL) => {
  const p = new URLSearchParams(url.search);
  IGNORED_QUERY.forEach((k) => p.delete(k));
  p.sort();
  return p.toString();
};
// Every call plays the same synthesized, fictional recording.
const CALL_AUDIO = "/__docs-media/call.mp3";
function withDocsAudio(body: unknown): unknown {
  if (Array.isArray(body)) return body.map(withDocsAudio);
  if (body && typeof body === "object") {
    return Object.fromEntries(Object.entries(body).map(([k, v]) =>
      [k, k === "recording_url" && typeof v === "string" ? CALL_AUDIO : withDocsAudio(v)]));
  }
  return body;
}

// Saves change what later reads return; previews and drafts don't (and their count varies run to run).
const changesState = (method: string, path: string) => method !== "GET" && !/\/(preview|draft)$/.test(path);

/** Signs in to the analytics app and answers its API from the scenario's fixture, or, with
 *  ANALYTICS_RECORD_API set, forwards to that server and records the fixture. Returns a function
 *  that writes the recording. */
export async function prepareAnalyticsContext(context: BrowserContext, session: AnalyticsSession, logFile: string) {
  const recordApi = process.env.ANALYTICS_RECORD_API;
  const file = join(ANALYTICS_FIXTURES, `${session.fixture}.json`);
  let token = "fixture-session";
  let workspaceId = "00000000-0000-4000-8000-000000000100";
  let fixture: Recorded[] = [];
  if (recordApi) {
    const tokens = JSON.parse(readFileSync(process.env.ANALYTICS_RECORD_TOKENS!, "utf8"));
    token = tokens.tokens[session.as];
    workspaceId = tokens.workspace_id;
  } else {
    const fx = JSON.parse(readFileSync(file, "utf8"));
    fixture = fx.calls;
    workspaceId = fx.workspace_id;
  }
  await context.addCookies([{ name: "qa_authed", value: "1", url: ANALYTICS_BASE }]);
  await context.addInitScript(([t, ws]) => {
    localStorage.setItem("qa_access_token", t);
    localStorage.setItem("qa_refresh_token", "fixture");
    localStorage.setItem("qa_workspace_id", ws);
  }, [token, workspaceId]);
  await context.route(`**${CALL_AUDIO}`, (route) => route.fulfill({ path: join(ANALYTICS_FIXTURES, "call.mp3"), contentType: "audio/mpeg" }));

  let phase = 0;
  const recorded: Recorded[] = [];
  const nth = new Map<string, number>();
  await context.route(/\/an\/api\/v0\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/an\/api\/v0/, "");
    const query = normQuery(url);
    const method = req.method();
    if (path.endsWith("/media-url")) {
      return route.fulfill({ json: { url: CALL_AUDIO, content_type: "audio/mpeg", expires_in: 3600 } });
    }
    if (recordApi) {
      const res = await fetch(recordApi + path + url.search, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: req.postData() ?? undefined,
      });
      const text = await res.text();
      let body: unknown = null;
      try { body = text ? withDocsAudio(JSON.parse(text)) : null; } catch { body = text; }
      recorded.push({ method, path, query, phase, status: res.status, body });
      if (changesState(method, path)) phase++;
      return route.fulfill({ status: res.status, contentType: "application/json", body: JSON.stringify(body) });
    }
    const same = fixture.filter((c) => c.method === method && c.path === path);
    let hit: Recorded | undefined;
    if (method !== "GET") {
      // Writes are answered in the order they were recorded.
      const n = nth.get(method + path) ?? 0;
      hit = same[Math.min(n, same.length - 1)];
      nth.set(method + path, n + 1);
      if (changesState(method, path)) phase++;
    } else {
      // Reads get the latest recorded answer from before the same number of saves.
      const exact = same.filter((c) => c.query === query);
      const pool = exact.length ? exact : same;
      hit = pool.filter((c) => c.phase <= phase).at(-1) ?? pool[0];
    }
    if (!hit) {
      appendFileSync(logFile, `${method} ${path}${query ? "?" + query : ""}\n`);
      return route.fulfill({ status: 404, contentType: "application/json", body: '{"detail":"Not found"}' });
    }
    return route.fulfill({ status: hit.status, contentType: "application/json", body: JSON.stringify(withDocsAudio(hit.body)) });
  });

  return () => {
    if (!recordApi) return;
    // One answer per read and phase (the last one seen); every write, in order.
    const seen = new Map<string, number>();
    recorded.forEach((c, i) => { if (c.method === "GET") seen.set(`${c.path}?${c.query}@${c.phase}`, i); });
    const calls = recorded.filter((c, i) => c.method !== "GET" || seen.get(`${c.path}?${c.query}@${c.phase}`) === i);
    mkdirSync(ANALYTICS_FIXTURES, { recursive: true });
    writeFileSync(file, JSON.stringify({ workspace_id: workspaceId, calls }, null, 1) + "\n");
  };
}

export async function gotoAnalytics(page: Page, route: string) {
  // Interactions poll while calls or disputes are open, so the network never goes idle;
  // scenarios wait for the content they need instead.
  await page.goto(ANALYTICS_BASE + route, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
  await cleanPage(page);
}
