// Runs scenarios: drives the production dashboard on fixtures, writes screenshots and a captioned video per scenario.
// Usage: node run.ts [scenario-name ...]   (no names = all)
import { chromium, type Locator, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { OUT, prepareContext, gotoDashboard, saveWebp, type RouteMap } from "./lib.ts";
import { installOverlay } from "./overlay.ts";

const DOCS_ROOT = resolve(import.meta.dirname, "../..");
const VIEWPORT = { width: 1440, height: 900 };
const COACHMARKS = ["logs-export-moved", "logs-rename", "prompt-editor-intro", "prompt-editor-selection-tools"];

export interface Scenario {
  name: string;
  /** Title card text; defaults to the docs page's sidebarTitle. */
  title?: string;
  /** true: outline the element the cursor moves to. Off by default (ankur: too distracting). */
  highlight?: boolean;
  /** Docs page this media belongs to, e.g. "agents/create". */
  docsPage: string;
  routes: RouteMap;
  run(s: Session): Promise<void>;
}

export class Session {
  timeline: { t: number; caption: string }[] = [];
  shots: string[] = [];
  /** When the first page finished loading; the video starts here, not on the blank tab. */
  readyAt = 0;
  /** Pauses the recording stream; Chrome can hang on a screenshot taken while it streams frames. */
  capture = { stop: async () => {}, start: async () => {} };
  page: Page;
  scenario: Scenario;
  constructor(page: Page, scenario: Scenario) {
    this.page = page;
    this.scenario = scenario;
  }

  async goto(route: string) {
    await gotoDashboard(this.page, route);
    await this.page.waitForTimeout(600);
    if (!this.readyAt) {
      await this.page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height / 2);
      this.readyAt = Date.now();
    }
  }

  /** Shows a caption for the steps that follow (burned into the video, logged for the .vtt file). */
  async caption(text: string, holdMs = 1600) {
    this.timeline.push({ t: Date.now(), caption: text });
    await this.page.evaluate((t) => (window as any).__docs?.caption(t), text);
    await this.page.waitForTimeout(holdMs);
  }

  private async moveTo(target: Locator) {
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) throw new Error(`No box for ${target}`);
    if (this.scenario.highlight) await this.page.evaluate((r) => (window as any).__docs?.ring(r), box);
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 28 });
    await this.page.waitForTimeout(350);
    return box;
  }

  async click(target: Locator, after = 900) {
    await this.moveTo(target);
    await target.click();
    await this.page.evaluate(() => (window as any).__docs?.ring(null));
    await this.page.waitForTimeout(after);
  }

  async type(target: Locator, text: string) {
    await this.moveTo(target);
    await target.click();
    await this.page.keyboard.type(text, { delay: 55 });
    await this.page.evaluate(() => (window as any).__docs?.ring(null));
    await this.page.waitForTimeout(500);
  }

  async hover(target: Locator, ms = 900) {
    await this.moveTo(target);
    await this.page.waitForTimeout(ms);
    await this.page.evaluate(() => (window as any).__docs?.ring(null));
  }

  async pause(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  /** Screenshot (overlay hidden) into media/<scenario>/<name>.webp. Crops to `target` (+padding) or the viewport. */
  async shot(name: string, target?: Locator, padding = 16) {
    await this.capture.stop();
    await this.page.evaluate(() => (window as any).__docs?.hidden(true));
    const dir = join(DOCS_ROOT, "media", this.scenario.name);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, `${name}.webp`);
    if (target) {
      const b = await target.boundingBox();
      if (!b) throw new Error(`No box for shot ${name}`);
      const x = Math.max(0, b.x - padding), y = Math.max(0, b.y - padding);
      saveWebp(await this.page.screenshot({ clip: { x, y, width: Math.min(VIEWPORT.width - x, b.width + padding * 2), height: Math.min(VIEWPORT.height - y, b.height + padding * 2) } }), path);
    } else saveWebp(await this.page.screenshot(), path);
    this.shots.push(path);
    await this.page.evaluate(() => (window as any).__docs?.hidden(false));
    await this.capture.start();
  }
}

function vtt(timeline: Session["timeline"], endMs: number) {
  const ts = (ms: number) => new Date(ms).toISOString().slice(11, 23);
  return "WEBVTT\n\n" + timeline.map((c, i) => `${ts(c.t)} --> ${ts(timeline[i + 1]?.t ?? endMs)}\n${c.caption}\n`).join("\n");
}

const TITLE_MS = 1500;
const INTER = readFileSync(resolve(import.meta.dirname, "assets/InterVariable.woff2")).toString("base64");

function titleFor(scenario: Scenario) {
  if (scenario.title) return scenario.title;
  const mdx = readFileSync(join(DOCS_ROOT, `${scenario.docsPage}.mdx`), "utf8");
  return mdx.match(/^sidebarTitle:\s*"?(.+?)"?\s*$/m)?.[1] ?? scenario.name;
}

/** White card with the page name in Inter (the dashboard's font), shown before the recording. */
async function renderTitleCard(browser: import("@playwright/test").Browser, title: string, path: string) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const esc = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  await page.setContent(`<style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${INTER}) format("woff2")}html,body{margin:0;height:100%;background:#fff}body{display:grid;place-items:center;font:600 56px/1.2 Inter,sans-serif;letter-spacing:-0.02em;color:#111114}</style><div>${esc}</div>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path, type: "jpeg", quality: 95 });
  await page.close();
}

async function runScenario(scenario: Scenario) {
  const raw = join(OUT, "raw", scenario.name);
  rmSync(raw, { recursive: true, force: true });
  mkdirSync(raw, { recursive: true });
  rmSync(join(OUT, `unmatched-${scenario.name}.log`), { force: true });
  // Without this flag the screencast sends 1x frames even at deviceScaleFactor 2.
  const browser = await chromium.launch({ args: ["--force-device-scale-factor=2"] });
  const titleCard = join(raw, "title.jpg");
  await renderTitleCard(browser, titleFor(scenario), titleCard);
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, colorScheme: "light" });
  await context.addInitScript((ids) => {
    localStorage.setItem("_ringg_coachmarks", JSON.stringify(Object.fromEntries(ids.map((id) => [id, { version: 9999, status: "completed" }]))));
  }, COACHMARKS);
  await context.addInitScript(installOverlay);
  await prepareContext(context, scenario.routes, join(OUT, `unmatched-${scenario.name}.log`));
  const page = await context.newPage();
  // Playwright actions never time out by default; fail fast instead of stalling a run.
  page.setDefaultTimeout(20000);
  const s = new Session(page, scenario);
  // Chrome's screencast gives full-resolution (2x) frames; Playwright's recordVideo is 1x at ~1 Mbps.
  const frames: { file: string; t: number }[] = [];
  const cdp = await context.newCDPSession(page);
  cdp.on("Page.screencastFrame", (f) => {
    const file = join(raw, `f${String(frames.length).padStart(5, "0")}.jpg`);
    writeFileSync(file, Buffer.from(f.data, "base64"));
    // Arrival time, not metadata.timestamp: Chrome occasionally sends a frame with a timestamp far off.
    frames.push({ file, t: Date.now() });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  const screencast = { format: "jpeg" as const, quality: 92, maxWidth: VIEWPORT.width * 2, maxHeight: VIEWPORT.height * 2 };
  await cdp.send("Page.startScreencast", screencast);
  s.capture = { stop: () => cdp.send("Page.stopScreencast").then(() => {}), start: () => cdp.send("Page.startScreencast", screencast).then(() => {}) };
  let endAt = 0;
  try {
    await scenario.run(s);
    await page.evaluate(() => (window as any).__docs?.caption(""));
    await page.waitForTimeout(800);
  } catch (e) {
    await page.screenshot({ path: join(OUT, `${scenario.name}-fail.png`) }).catch(() => {});
    throw e;
  } finally {
    endAt = Date.now();
    await cdp.send("Page.stopScreencast").catch(() => {});
    await context.close();
    await browser.close();
  }
  // One folder per scenario: media/<name>/{screenshots, video.webm, poster.webp, captions.vtt}.
  const dir = join(DOCS_ROOT, "media", scenario.name);
  mkdirSync(dir, { recursive: true });
  const webm = join(dir, "video.webm");
  // Drop the blank tab and loader: keep the last frame before the page was ready, then everything after.
  const firstReady = frames.findIndex((f) => f.t >= s.readyAt);
  if (s.readyAt && firstReady > 0) frames.splice(0, firstReady - 1);
  if (frames.length > 1 && frames[0].t < s.readyAt) frames[0].t = s.readyAt;
  if (frames.length) frames.unshift({ file: titleCard, t: frames[0].t - TITLE_MS });
  const startAt = frames[0]?.t ?? endAt;
  rmSync(webm, { force: true });
  rmSync(join(dir, "captions.vtt"), { force: true });
  // Screenshot-only scenarios (no captions) get no video.
  if (frames.length && s.timeline.length) {
    // Frames arrive only when the page repaints, so each one is held until the next.
    // 1920 px: the docs show videos ~800 px wide, so 2x capture downscaled stays sharp at ~40% of the size.
    const list = frames.map((f, i) => `file '${f.file}'\nduration ${(((frames[i + 1]?.t ?? endAt) - f.t) / 1000).toFixed(3)}`);
    writeFileSync(join(raw, "frames.txt"), list.join("\n") + `\nfile '${frames.at(-1)!.file}'\n`);
    // 60 fps: the screencast delivers ~60 frames/s while the cursor moves, so motion stays smooth.
    // AV1 in WebM: half the size of H.264 at the same SSIM. No MP4 fallback (ankur's call), so Safari needs AV1 hardware.
    const input = ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(raw, "frames.txt"), "-vf", "fps=60,scale=1920:-2:flags=lanczos", "-pix_fmt", "yuv420p", "-an"];
    execFileSync("ffmpeg", [...input, "-c:v", "libsvtav1", "-crf", "55", "-preset", "8", "-svtav1-params", "tune=0", webm], { stdio: ["ignore", "pipe", "pipe"] }); // pipe: SVT-AV1 prints a banner on stderr even at -loglevel error
  }
  // Poster: the title card, so the player never shows an empty box before it loads.
  if (existsSync(webm)) saveWebp(execFileSync("ffmpeg", ["-loglevel", "error", "-i", titleCard, "-vf", "scale=1440:-2", "-f", "image2pipe", "-c:v", "png", "-"]), join(dir, "poster.webp"), false);
  const endMs = endAt - startAt;
  const timeline = s.timeline.map((c) => ({ ...c, t: Math.max(0, c.t - startAt) }));
  if (s.timeline.length) writeFileSync(join(dir, "captions.vtt"), vtt(timeline, endMs));
  writeFileSync(join(OUT, `${scenario.name}.timeline.json`), JSON.stringify(timeline, null, 2));
  // Raw frames run to gigabytes per scenario; the video, poster and timeline are all that is kept.
  rmSync(raw, { recursive: true, force: true });
  const unmatched = join(OUT, `unmatched-${scenario.name}.log`);
  const missing = existsSync(unmatched) ? [...new Set(readFileSync(unmatched, "utf8").trim().split("\n"))] : [];
  return { name: scenario.name, video: webm, shots: s.shots.length, seconds: Math.round(endMs / 1000), missing };
}

const wanted = process.argv.slice(2);
const files = readdirSync(resolve(import.meta.dirname, "scenarios")).filter((f) => f.endsWith(".ts"));
for (const f of files) {
  const scenario: Scenario = (await import(`./scenarios/${f}`)).default;
  if (wanted.length && !wanted.includes(scenario.name)) continue;
  try {
    const r = await runScenario(scenario);
    console.log(`✔ ${r.name}: ${r.shots} shots, ${r.seconds}s video` + (r.missing.length ? `\n  unanswered calls: ${r.missing.join(", ")}` : ""));
  } catch (e) {
    console.log(`✘ ${scenario.name}: ${(e as Error).message.split("\n")[0]}`);
  }
}
