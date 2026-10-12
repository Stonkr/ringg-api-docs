import { type BrowserContext, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
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
