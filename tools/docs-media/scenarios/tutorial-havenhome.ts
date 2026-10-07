import type { Locator } from "@playwright/test";
import type { Scenario } from "../run.ts";
import { havenhomeRoutes, BUILD_ID, RUN_ID } from "../fixtures/havenhome.ts";
import { chromium } from "@playwright/test";
import { OUT, gotoDashboard, prepareContext, saveWebp } from "../lib.ts";

const INPUTS = ["chat_summary", "shortlisted_products", "mattress_size", "sleep_style", "comparison_criteria", "call_consent", "store_visit_interest", "city"];

export default {
  name: "tutorial-havenhome",
  title: "HavenHome assisted purchase journey",
  highlight: false,
  docsPage: "workflows/build",
  routes: havenhomeRoutes(),
  async run(s) {
    try { await this.body(s); } catch (e) { if (process.env.HH_DEBUG) console.log(String(e).slice(0, 2500)); throw e; }
  },
  async body(s: import("../run.ts").Session) {
    const p = s.page;
    p.setDefaultTimeout(20000);
    const debug = process.env.HH_DEBUG;
    const snap = async (name: string) => { if (debug) await p.screenshot({ path: `${OUT}/hh/${name}.png` }); };

    const fclick = async (target: Locator, after = 300) => {
      await target.scrollIntoViewIfNeeded();
      const b = await target.boundingBox();
      if (b) await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
      await p.waitForTimeout(110);
      await target.click();
      await p.waitForTimeout(after);
    };
    const fit = async () => { await p.getByRole("button", { name: "Fit to screen" }).first().click(); await s.pause(700); };
    // Quick typing for values; the cursor still travels to the field first.
    const qtype = async (target: Locator, text: string, delay = 28) => {
      await fclick(target, 120);
      await p.keyboard.type(text, { delay });
      await s.pause(250);
    };
    const replaceNumber = async (target: Locator, value: string) => {
      await fclick(target, 100);
      await p.keyboard.press("ControlOrMeta+a");
      await p.keyboard.type(value, { delay: 60 });
      await p.keyboard.press("Tab");
      await s.pause(250);
    };
    const pick = async (trigger: Locator, option: string | RegExp, after = 350) => {
      await fclick(trigger, 450);
      await fclick(p.getByRole("option", { name: option }).first(), after);
    };
    // Smoothly pans the canvas so `node` sits at (x, y) on screen.
    const pan = async (node: Locator, x = 600, y = 84) => {
      const box = await node.boundingBox();
      if (!box) return;
      const dx = (box.x - x) * 2, dy = (box.y - y) * 2, steps = 14;
      for (let i = 0; i < steps; i++) {
        await p.evaluate(([ddx, ddy]) => {
          document.querySelector(".react-flow__pane")!.dispatchEvent(new WheelEvent("wheel", { deltaX: ddx, deltaY: ddy, bubbles: true, cancelable: true, clientX: 700, clientY: 500 }));
        }, [dx / steps, dy / steps]);
        await p.waitForTimeout(22);
      }
      await s.pause(250);
    };
    const panBy = async (dxScreen: number, dyScreen: number, ms: number) => {
      const steps = Math.max(1, Math.round(ms / 30));
      for (let i = 0; i < steps; i++) {
        await p.evaluate(([ddx, ddy]) => {
          document.querySelector(".react-flow__pane")!.dispatchEvent(new WheelEvent("wheel", { deltaX: ddx, deltaY: ddy, bubbles: true, cancelable: true, clientX: 700, clientY: 500 }));
        }, [(dxScreen * 2) / steps, (dyScreen * 2) / steps]);
        await p.waitForTimeout(ms / steps);
      }
    };
    const nodeById = (id: string) => p.locator(`.react-flow__node[data-id="${id}"]`);
    // Adds a block from a connector on `from` and returns the new node.
    const add = async (from: Locator, handle: string, block: RegExp) => {
      await fclick(from.getByLabel(handle), 450);
      await fclick(p.getByRole("option", { name: block }), 700);
      const id = await p.locator(".react-flow__node").last().getAttribute("data-id");
      const node = nodeById(id!);
      await pan(node);
      return node;
    };
    const rename = async (node: Locator, family: string, name: string) => {
      await fclick(node.getByRole("button", { name: `Rename this ${family} node` }), 150);
      await p.keyboard.press("ControlOrMeta+a");
      await p.keyboard.type(name, { delay: 22 });
      await p.keyboard.press("Enter");
      await s.pause(300);
    };
    const clickPane = async () => { await p.mouse.click(300, 160); await s.pause(300); };
    const NEXT = "Add the next node, or drag to connect";
    const MATCH = "Add the node that runs when the rules match, or drag to connect";

    // Create
    await s.goto("/workflows");
    await s.caption("Open Workflows and click Create workflow", 700);
    await fclick(p.getByRole("link", { name: "Create a workflow" }), 1400);

    await s.caption("Name the workflow", 300);
    await fclick(p.getByRole("button", { name: "Edit workflow name" }), 300);
    await p.getByRole("textbox", { name: "Workflow name" }).fill("");
    await p.keyboard.type("HavenHome assisted purchase journey", { delay: 22 });
    await p.keyboard.press("Enter");
    await s.pause(300);

    // Inputs
    await s.caption("Declare the inputs passed in from the website chat", 300);
    await fclick(p.getByRole("button", { name: "Edit workflow variables" }).locator("visible=true").first(), 500);
    for (const name of INPUTS) {
      await fclick(p.getByRole("button", { name: "Add a variable" }), 150);
      await qtype(p.getByRole("textbox", { name: "Variable name" }).last(), name, 18);
    }
    await s.pause(700);
    await snap("vars");
    await p.keyboard.press("Escape");
    await s.pause(300);

    // 1. Store visit and call consent?
    await s.caption("Add a Conditional after Start", 300);
    const start = p.locator(".react-flow__node").first();
    const c1 = await add(start, NEXT, /^Conditional/);
    await rename(c1, "condition", "Store visit and call consent?");
    await s.caption("Branch only if the customer agreed to a call and a visit", 300);
    for (const variable of ["call_consent", "store_visit_interest"]) {
      await fclick(c1.getByRole("button", { name: "Add a rule" }), 300);
      await pick(c1.getByRole("button", { name: /Rule source/ }).last(), "Custom variable");
      await fclick(c1.getByRole("combobox", { name: "Which variable" }).last(), 450);
      await fclick(p.getByRole("option", { name: new RegExp(`^${variable}`) }).first(), 300);
      await qtype(c1.getByRole("textbox", { name: "Value to compare against" }).last(), "true");
    }
    await c1.getByLabel("All rules must match", { exact: true }).hover();
    await s.pause(500);
    await snap("c1");

    // 2. Store-details call
    await s.caption("Add an Agent block to call the customer", 300);
    const a1 = await add(c1, MATCH, /^Agent/);
    await s.caption("Pick the store guide agent and map its variables", 300);
    await pick(a1.getByRole("button", { name: /Select an agent/ }), "HavenHome store guide", 500);
    await rename(a1, "agent", "Store-details call");
    await fclick(a1.getByRole("button", { name: "Map agent variables from upstream" }).last(), 700);
    const dialog = p.getByRole("dialog");
    for (const name of ["chat_summary", "shortlisted_products", "mattress_size", "sleep_style", "city"]) {
      await fclick(dialog.getByRole("combobox", { name: `Value for ${name}` }), 350);
      await fclick(p.getByRole("option", { name: new RegExp(`^${name}`) }).first(), 250);
    }
    await s.pause(600);
    await snap("a1-map");
    await clickPane();
    await s.caption("Choose a From number and allow one retry", 300);
    await fclick(a1.getByRole("button", { name: "Caller numbers" }).last(), 600);
    await fclick(p.getByRole("option", { name: /40110/ }), 400);
    await clickPane();
    await replaceNumber(a1.getByRole("textbox", { name: "How many times to retry" }), "1");
    await s.pause(500);
    await s.shot("agent-block", a1, 16);
    await snap("a1");

    // 3. WhatsApp consent given?
    await s.caption("Branch on WhatsApp consent from the call's analysis", 300);
    const c2 = await add(a1, NEXT, /^Conditional/);
    await rename(c2, "condition", "WhatsApp consent given?");
    await fclick(c2.getByRole("button", { name: "Add a rule" }), 300);
    await pick(c2.getByRole("button", { name: /Rule source/ }), "Custom analysis");
    await pick(c2.getByRole("button", { name: /Which field|Pick a field/ }), "WhatsApp consent");
    await qtype(c2.getByRole("textbox", { name: "Value to compare against" }), "true");
    await snap("c2");

    // 4. Store details on WhatsApp
    await s.caption("Send store details on WhatsApp", 300);
    const m1 = await add(c2, MATCH, /^Agent/);
    await fclick(m1.getByLabel("Chat", { exact: true }), 500);
    await pick(m1.getByRole("button", { name: /Select an agent/ }), "HavenHome WhatsApp concierge", 400);
    await rename(m1, "agent", "Store details on WhatsApp");
    await qtype(m1.getByRole("textbox", { name: "WhatsApp template name" }), "store_visit_details");
    await qtype(m1.getByRole("textbox", { name: "WhatsApp phone number id" }), "104857600211");
    await snap("m1");

    // 5. Store visit logged
    await s.caption("Wait for the store visit to be logged, up to 7 days", 300);
    const w1 = await add(m1, NEXT, /^Await/);
    await fclick(w1.getByLabel("Wait for an event", { exact: true }), 400);
    await rename(w1, "await", "Store visit logged");
    await qtype(w1.getByRole("textbox", { name: "Event name to wait for" }), "store_visit_logged");
    await replaceNumber(w1.getByRole("textbox", { name: "Fallback timeout amount" }), "7");
    await pick(w1.getByRole("button", { name: /Fallback timeout unit/ }), "days");
    await snap("w1");

    // 6. Wait 2 days
    await s.caption("Then wait 2 more days", 300);
    const w2 = await add(w1, "Add the node that runs when the event arrives, or drag to connect", /^Await/);
    await rename(w2, "await", "Wait 2 days");
    await replaceNumber(w2.getByRole("textbox", { name: "How long to wait" }), "2");
    await pick(w2.getByRole("button", { name: /Duration unit/ }), "days");
    await snap("w2");

    // 7. Fetch store-visit notes
    await s.caption("Fetch the store-visit notes from your CRM", 300);
    const d1 = await add(w2, NEXT, /^Action/);
    await rename(d1, "action", "Fetch store-visit notes");
    await qtype(d1.getByRole("textbox", { name: "Request URL" }), "https://crm.havenhome.example/v1/store-visits?phone={{callee.mobile_number}}", 10);
    await pick(d1.getByRole("button", { name: /Integration to authenticate with/ }), "HavenHome CRM");
    await snap("d1");

    await s.caption("Save your progress", 300);
    await fclick(p.getByRole("button", { name: "Save the workflow" }), 1600);
    await snap("saved");

    // 8. Comparison call
    await s.caption("Call again with the comparison advisor", 300);
    const d1Now = nodeById((await d1.getAttribute("data-id"))!);
    await pan(d1Now);
    const a2 = await add(d1Now, NEXT, /^Agent/);
    await pick(a2.getByRole("button", { name: /Select an agent/ }), "HavenHome comparison advisor", 500);
    await rename(a2, "agent", "Comparison call");
    await s.caption("Map the chat context and the store-visit notes", 300);
    await fclick(a2.getByRole("button", { name: "Map agent variables from upstream" }).last(), 900);
    const rows: [string, RegExp][] = [
      ["chat_summary", /^chat_summary/],
      ["shortlisted_products", /^shortlisted_products/],
      ["products_tried", /^Products tried/],
      ["objections", /^Objections/],
      ["visit_outcome", /^Visit outcome/],
    ];
    for (const [name, option] of rows) {
      await fclick(dialog.getByRole("combobox", { name: `Value for ${name}` }), 350);
      await fclick(p.getByRole("option", { name: option }).first(), 250);
    }
    await s.pause(700);
    await snap("a2-map");
    await clickPane();
    await fclick(a2.getByRole("button", { name: "Caller numbers" }).last(), 600);
    await fclick(p.getByRole("option", { name: /40111/ }), 400);
    await clickPane();
    await replaceNumber(a2.getByRole("textbox", { name: "How many times to retry" }), "1");
    await snap("a2");

    // 9. Final comparison on WhatsApp
    await s.caption("Send the final comparison on WhatsApp", 300);
    const m2 = await add(a2, NEXT, /^Agent/);
    await fclick(m2.getByLabel("Chat", { exact: true }), 500);
    await pick(m2.getByRole("button", { name: /Select an agent/ }), "HavenHome WhatsApp concierge", 400);
    await rename(m2, "agent", "Final comparison on WhatsApp");
    await qtype(m2.getByRole("textbox", { name: "WhatsApp template name" }), "final_recommendation");
    await qtype(m2.getByRole("textbox", { name: "WhatsApp phone number id" }), "104857600211");

    // 10. Check purchase status
    await s.caption("Check the purchase status in your shop API", 300);
    const d2 = await add(m2, NEXT, /^Action/);
    await rename(d2, "action", "Check purchase status");
    await qtype(d2.getByRole("textbox", { name: "Request URL" }), "https://shop.havenhome.example/v1/orders/status?phone={{callee.mobile_number}}", 10);
    await pick(d2.getByRole("button", { name: /Integration to authenticate with/ }), "HavenHome Shop API");

    // 11. Purchase verified?
    await s.caption("Branch on whether the purchase is verified", 300);
    const c3 = await add(d2, NEXT, /^Conditional/);
    await rename(c3, "condition", "Purchase verified?");
    await fclick(c3.getByRole("button", { name: "Add a rule" }), 300);
    await pick(c3.getByRole("button", { name: /Rule source/ }), "Tool response");
    await pick(c3.getByRole("button", { name: /Which upstream block/ }), "Check purchase status");
    await qtype(c3.getByRole("textbox", { name: "Field name" }), "purchase_status");
    await qtype(c3.getByRole("textbox", { name: "Value to compare against" }), "verified");
    await s.caption("Both branches end here: no more calls", 1200);
    await snap("c3");


    // Save, publish, test
    await s.caption("Click Save, then Publish", 300);
    await fclick(p.getByRole("button", { name: "Save the workflow" }), 1300);
    await fclick(p.getByRole("button", { name: "Publish the workflow" }), 700);
    await fclick(p.getByRole("button", { name: "Confirm publish" }), 1400);

    await s.caption("Click Test and fill in the chat context", 300);
    await fclick(p.getByRole("button", { name: "Start a test run" }), 700);
    const values: Record<string, string> = {
      callee_name: "Ananya Iyer",
      callee_number: "+91 98765 43317",
      chat_summary: "Wants a medium-firm queen mattress for back pain",
      shortlisted_products: "CloudRest Hybrid, OrthoLux Memory Foam",
      mattress_size: "Queen",
      sleep_style: "Back sleeper",
      comparison_criteria: "Firmness, cooling, price under ₹45,000",
      call_consent: "true",
      store_visit_interest: "true",
      city: "Bengaluru",
    };
    for (const [name, value] of Object.entries(values)) await p.getByRole("textbox", { name: `Value for ${name}` }).fill(value);
    await s.pause(1200);
    await snap("test");
    await s.caption("Start the run and watch each block finish", 300);
    await fclick(p.getByRole("button", { name: "Start the test run" }), 900);
    await fit();
    await panBy(-720, 0, 700);
    await s.pause(1500);
    await panBy(1440, 0, 8500);
    await s.caption("Completed: the purchase was verified", 200);
    // Keep the page repainting so the screencast captures the caption.
    await p.mouse.move(1100, 620, { steps: 20 });
    await panBy(60, 0, 1500);
    await s.pause(1800);
    // Whole-canvas screenshots need a wider window than the 1440 px recording (min zoom is 0.5).
    // A separate browser on the same stub state, so the recorded tab keeps painting.
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 3300, height: 1000 }, deviceScaleFactor: 2 });
    await prepareContext(ctx, s.scenario.routes, `${OUT}/unmatched-tutorial-havenhome.log`);
    await ctx.addInitScript(() => localStorage.setItem("_ringg_coachmarks", JSON.stringify(Object.fromEntries(["logs-export-moved", "logs-rename", "prompt-editor-intro"].map((id) => [id, { version: 9999, status: "completed" }])))));
    const wide = await ctx.newPage();
    wide.setDefaultTimeout(20000);
    const dir = new URL("../../../media/tutorial-havenhome/", import.meta.url).pathname;
    for (const [route, file] of [[`/workflows/${BUILD_ID}?run=${RUN_ID}`, "test-run-path.webp"], [`/workflows/${BUILD_ID}`, "workflow-canvas.webp"]]) {
      await gotoDashboard(wide, route);
      await wide.waitForTimeout(1500);
      await wide.getByRole("button", { name: "Fit to screen" }).first().click();
      await wide.waitForTimeout(900);
      const boxes = await wide.locator(".react-flow__node").evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.left, r.top, r.right, r.bottom]));
      const x0 = Math.min(...boxes.map((b) => b[0])) - 48, x1 = Math.max(...boxes.map((b) => b[2])) + 48;
      const y0 = Math.min(...boxes.map((b) => b[1])) - 48, y1 = Math.max(...boxes.map((b) => b[3])) + 48;
      saveWebp(await wide.screenshot({ clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } }), dir + file);
    }
    await browser.close();
  },
} satisfies Scenario;
