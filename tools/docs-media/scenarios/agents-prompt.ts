import type { Locator } from "@playwright/test";
import type { Scenario, Session } from "../run.ts";
import { AGENT_ID, editorARoutes } from "../fixtures/editor-a.ts";

/** Puts the caret at the end of a block in a prompt editor (a centre click can land on a chip; aim at the last line). */
async function clickEnd(s: Session, block: Locator) {
  await s.hover(block, 200);
  const b = (await block.boundingBox())!;
  await block.click({ position: { x: b.width - 3, y: Math.max(b.height / 2, b.height - 8) } });
  await s.page.keyboard.press("End");
  await s.pause(300);
}

/** Drags across `text` inside `editor` like a reader selecting it, so the selection toolbar opens. */
async function selectText(s: Session, editor: Locator, text: string) {
  await editor.scrollIntoViewIfNeeded();
  const r = await editor.evaluate((el, sub) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const i = n.textContent!.indexOf(sub);
      if (i < 0) continue;
      const range = document.createRange();
      range.setStart(n, i);
      range.setEnd(n, i + sub.length);
      const b = range.getBoundingClientRect();
      return { x: b.x, y: b.y + b.height / 2, w: b.width };
    }
    return null;
  }, text);
  if (!r) throw new Error(`No "${text}" in editor`);
  await s.page.mouse.move(r.x + 1, r.y, { steps: 20 });
  await s.page.mouse.down();
  await s.page.mouse.move(r.x + r.w - 1, r.y, { steps: 14 });
  await s.page.mouse.up();
  await s.pause(600);
}

export default {
  name: "agents-prompt",
  docsPage: "agents/prompt",
  routes: {
    ...editorARoutes({ tools: true }),
    "POST /agent/transliterate": { transliterated_text: "कभी भी कार्ड नंबर, OTP या पासवर्ड न पूछें" },
  },
  async run(s) {
    const p = s.page;
    // The selection-toolbar coachmark is not in the runner's list; mark it done too.
    await p.addInitScript(() => {
      const key = "_ringg_coachmarks";
      const done = JSON.parse(localStorage.getItem(key) || "{}");
      done["prompt-editor-selection-tools"] = { version: 9999, status: "completed" };
      localStorage.setItem(key, JSON.stringify(done));
    });
    await s.goto(`/assistants/${AGENT_ID}`);
    const editor = (text: string) => p.locator(".ProseMirror").filter({ hasText: text }).first();
    const intro = editor("Is this a good time");
    const goal = editor("clear commitment");
    const flow = editor("Close politely");
    const rules = editor("collections team");

    await s.caption("Open Prompt: the first message, then each section");
    await s.hover(p.getByText("First message", { exact: true }), 700);
    await s.shot("prompt-section");
    await s.caption("Interruptible: callers can talk over the first message", 300);
    await s.hover(p.getByLabel("Toggle intro interruptibility"), 900);

    await s.caption("Edit the first message", 400);
    await clickEnd(s, intro.locator("p").last());
    await p.keyboard.type(" It will only take a minute.", { delay: 30 });
    await s.pause(400);

    await s.caption("Edit a prompt section", 400);
    await clickEnd(s, flow.locator("li").last());
    await p.keyboard.press("Enter");
    await p.keyboard.type("If they cannot pay by ", { delay: 30 });

    await s.caption("Type @ to insert a variable, tool or knowledge base", 300);
    await p.keyboard.type("@", { delay: 30 });
    await s.pause(1300);
    await s.shot("mention-menu", p.getByRole("button", { name: /If Condition/ }).locator("xpath=ancestor::div[contains(@class,'overflow-y-auto')][1]"), 40);
    await p.keyboard.type("date", { delay: 100 });
    await s.pause(700);
    await p.keyboard.press("Enter");
    await p.keyboard.type(", offer to call again in two days.", { delay: 30 });
    await s.pause(500);

    await s.caption("Mention an on-call tool so the agent uses it", 300);
    await clickEnd(s, rules.locator("p").last());
    await p.keyboard.type(" If they say they already paid, use @check", { delay: 30 });
    await s.pause(800);
    await p.keyboard.press("Enter");
    await s.pause(400);

    await s.caption("No match? Create the variable from the menu", 300);
    await p.keyboard.type(". Quote @{{loan_id", { delay: 50 });
    await s.pause(500);
    await s.click(p.getByText(/Create\s*"\{\{loan_id\}\}"/), 700);

    await s.caption("Logic → If Condition: text that applies only sometimes", 300);
    await clickEnd(s, goal.locator("p").last());
    await p.keyboard.press("Enter");
    await p.keyboard.type("@if", { delay: 60 });
    await s.pause(400);
    await p.keyboard.press("Enter");
    await s.pause(500);
    await s.click(p.getByLabel("Select variable").first(), 300);
    await p.keyboard.type("due a", { delay: 50 });
    await p.keyboard.press("Enter");
    await s.pause(200);
    await s.click(p.getByRole("button", { name: /equals/ }).first(), 300);
    await s.click(p.getByRole("option", { name: "greater than", exact: true }), 200);
    await s.click(p.getByPlaceholder("value").first(), 100);
    await p.keyboard.type("10000", { delay: 50 });
    await s.click(p.locator('[aria-label="prompt"]').first(), 100);
    await p.keyboard.type("Offer to split the EMI into two payments.", { delay: 20 });
    await s.pause(700);

    await s.caption("Select text: format, find and replace, or translate", 300);
    await selectText(s, goal, "EMI");
    await s.click(p.locator('button[aria-label="Find and replace all"]'), 900);
    await s.caption("Find and replace works across every section", 300);
    await p.keyboard.type("instalment", { delay: 60 });
    await p.keyboard.press("Enter");
    await s.pause(1100);
    await s.click(p.getByRole("button", { name: "Undo" }), 700);

    await s.caption("Translate converts a selection to the secondary language", 300);
    await selectText(s, rules, "Never ask for card numbers, OTPs or passwords");
    await s.click(p.locator('button[aria-label="Translate selection"]'), 1300);
    await s.click(p.getByRole("button", { name: /Keep/ }), 900);

    await s.caption("Unsaved edits swap Test assistant for Discard and Save", 300);
    await s.hover(p.getByRole("button", { name: "Discard" }).first(), 900);
    await s.caption("Click Save (or press Cmd+S)", 300);
    await s.click(p.getByRole("button", { name: "Save prompt changes" }), 1600);
    await s.caption("Saved: Test assistant is back in the top bar", 1000);
    await s.hover(p.getByRole("button", { name: /Test assistant/ }), 1000);
    await s.shot("saved-section", flow.locator("xpath=ancestor::div[contains(@class,'rounded')][1]"));
  },
} satisfies Scenario;
