// Opens a dashboard route with the shared fixtures and logs backend calls nothing answers yet.
// Usage: node probe.ts /assistants
import { chromium } from "@playwright/test";
import { rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { OUT, prepareContext, gotoDashboard } from "./lib.ts";

const route = process.argv[2] ?? "/assistants";
rmSync(join(OUT, "unmatched.log"), { force: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await prepareContext(context, {});
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
await gotoDashboard(page, route);
await page.waitForTimeout(2500);
console.log("url:", page.url());
if (existsSync(join(OUT, "unmatched.log"))) console.log("unmatched:\n" + [...new Set(readFileSync(join(OUT, "unmatched.log"), "utf8").trim().split("\n"))].join("\n"));
await page.screenshot({ path: join(OUT, "probe.png") });
await browser.close();
