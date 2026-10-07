import type { Locator } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Scenario, Session } from "../run.ts";
import { routeSttTranscribe, sttRoutes } from "../fixtures/stt.ts";
import { saveWebp } from "../lib.ts";

const SAMPLE_WAV = resolve(import.meta.dirname, "../fixtures/stt-sample.wav");

/** Like s.shot, but clipped from the top of `from` to the bottom of `to` (the drawer is full-height and mostly empty). */
async function shotSpan(s: Session, name: string, from: Locator, to: Locator, pad = 8) {
  await s.capture.stop();
  await s.page.evaluate(() => (window as any).__docs?.hidden(true));
  const a = (await from.boundingBox())!, b = (await to.boundingBox())!;
  const dir = join(import.meta.dirname, "../../../media", s.scenario.name);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${name}.webp`);
  saveWebp(await s.page.screenshot({ clip: { x: a.x - pad, y: a.y - pad, width: a.width + pad * 2, height: b.y + b.height - a.y + pad * 2 } }), path);
  s.shots.push(path);
  await s.page.evaluate(() => (window as any).__docs?.hidden(false));
  await s.capture.start();
}

export default {
  name: "parrot-stt",
  title: "Parrot STT",
  docsPage: "parrot-stt/python-sdk",
  routes: sttRoutes(),
  async run(s) {
    const p = s.page;
    await routeSttTranscribe(p);
    await s.goto("/stt");
    await p.getByRole("heading", { name: "Speech To Text" }).waitFor();
    const tryIt = p.getByRole("button", { name: "Upload audio file" }).locator("xpath=ancestor::div[contains(@class,'md:flex-row')][1]");

    await s.caption("Open Labs → STT in the sidebar", 400);
    await s.hover(p.getByRole("link", { name: "STT" }), 1200);

    await s.caption("Pick the language and turn on punctuation", 400);
    await s.click(p.locator('button[aria-label="Language"]'), 500);
    await s.click(p.locator('[role="option"]').filter({ hasText: /^English$/ }).locator("visible=true").first(), 500);
    await s.click(p.getByRole("switch", { name: "Punctuation" }), 600);

    await s.caption("Upload a WAV, MP3, FLAC or M4A file", 400);
    const chooser = p.waitForEvent("filechooser");
    await s.click(p.getByRole("button", { name: "Upload audio file" }), 200);
    await (await chooser).setFiles(SAMPLE_WAV);
    await p.getByText("6.2s").waitFor({ timeout: 10000 });
    await s.caption("The transcript and audio length appear", 400);
    await s.hover(p.getByText("6.2s"), 1600);
    await s.shot("try-it", tryIt, 0);

    await s.caption("Code shows the same request in TypeScript, Python and cURL", 400);
    await s.click(p.getByRole("tab", { name: "Code" }), 800);
    await s.click(p.locator('button[aria-label="Code language"]'), 500);
    await s.click(p.locator('[role="option"]').filter({ hasText: /^Python$/ }).locator("visible=true").first(), 1400);

    await s.caption("Logs lists every request; click one for its details", 400);
    await s.click(p.getByRole("tab", { name: "Logs" }), 1200);
    await s.click(p.getByRole("row").filter({ hasText: "acme00000011" }), 1400);
    await s.click(p.getByRole("tab", { name: "Latency" }), 1200);
    await shotSpan(s, "log-detail", p.getByRole("dialog"), p.getByText("Segments").locator("xpath=ancestor::div[contains(@class,'rounded')][1]").last(), 0);
    await s.click(p.getByRole("button", { name: "Close STT log drawer" }), 800);

    await s.caption("Usage tracks requests, audio processed and credits", 400);
    await s.click(p.getByRole("tab", { name: "Usage" }), 1200);
    await s.hover(p.locator(".recharts-wrapper"), 1400);

    await s.caption("Pricing shows the rate for your currency", 400);
    await s.click(p.getByRole("tab", { name: "Pricing" }), 1600);

    await s.caption("The SDK needs an API key: Settings → API key", 400);
    await s.goto("/settings/api-key");
    await s.click(p.getByRole("button", { name: "Generate API key" }), 1200);
    const dialog = p.getByRole("dialog");
    await s.caption("Copy it once and store it as RINGG_API_KEY", 400);
    await s.hover(dialog.getByRole("button", { name: "Copy API key" }), 1400);
    await s.shot("api-key", dialog, 24);
    await s.click(dialog.getByRole("button", { name: /^Done/ }), 1000);
  },
} satisfies Scenario;
