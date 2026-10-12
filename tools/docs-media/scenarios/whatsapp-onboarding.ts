import type { Scenario } from "../run.ts";
import { makeEditorBRoutes, shotNoToasts } from "../fixtures/editor-b.ts";
import { WA_ACCOUNT_ID, WA_WABA_ID, makeWhatsappOnboardingRoutes } from "../fixtures/whatsapp.ts";

const editorB = makeEditorBRoutes() as Record<string, unknown>;

// Meta's Embedded Signup can't run on stubs. The SDK is replaced by a stub whose login() posts the
// finish event from a facebook.com-origin frame (served by the same interception) and returns a code,
// so the dashboard's own post-signup flow (exchange, toast, redirect) is what gets recorded.
const FB_STUB = `window.FB = { init() {}, login(cb) { const f = document.createElement("iframe"); f.style.display = "none"; f.src = "https://www.facebook.com/__docs_signup"; document.body.appendChild(f); setTimeout(() => cb({ authResponse: { code: "docs-stub-code" } }), 2200); } }; window.fbAsyncInit && window.fbAsyncInit();`;
const FB_FRAME = `<!doctype html><script>parent.postMessage(JSON.stringify({ type: "WA_EMBEDDED_SIGNUP", event: "FINISH_ONLY_WABA", data: { waba_id: "${WA_WABA_ID}" } }), "*");</script>`;

export default {
  name: "whatsapp-onboarding",
  docsPage: "whatsapp/onboarding",
  routes: { "GET /workspace-tools": editorB["GET /workspace-tools"], "GET /workspace/features": {}, ...makeWhatsappOnboardingRoutes() },
  async run(s) {
    const p = s.page;
    await p.route("**/connect.facebook.net/**", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: FB_STUB }));
    await p.route("https://www.facebook.com/__docs_signup", (route) => route.fulfill({ status: 200, contentType: "text/html", body: FB_FRAME }));

    await s.goto("/integrations");
    await s.caption("Open Tools and find WhatsApp Business under Add more tools", 600);
    const card = p.getByRole("button", { name: "Open WhatsApp Business" });
    await card.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "smooth" }));
    await s.pause(900);
    await s.click(card, 1200);

    await s.caption("Click Setup WhatsApp Business Account", 500);
    const dialog = p.getByRole("dialog");
    await shotNoToasts(s, "connect-modal", dialog, 0);
    await s.click(dialog.getByRole("button", { name: "Setup WhatsApp Business Account" }), 400);
    await s.caption("Meta's sign-in window opens here (not shown)", 2600);
    await p.waitForURL(`**/integrations/whatsapp/${WA_ACCOUNT_ID}`, { timeout: 15000 });
    await s.caption("Connected: the account page lists your numbers", 1600);
    await shotNoToasts(s, "phone-numbers", p.getByRole("grid", { name: "WhatsApp phone numbers" }).locator("xpath=ancestor::section[1]"), 0);

    await s.caption("Click Register on the pending number", 500);
    await s.click(p.getByRole("button", { name: "Register +91 98765 40322" }), 1000);
    await s.caption("Set an optional 6-digit PIN, then click Register", 500);
    const otp = p.getByRole("dialog").locator("input").first();
    await otp.click();
    await p.keyboard.type("482915", { delay: 90 });
    await s.pause(500);
    await s.click(p.getByRole("button", { name: "Register number" }), 2200);
    await s.caption("The number is Ready: it can send and receive", 1400);

    await s.caption("Open Message templates", 500);
    await s.click(p.getByRole("tab", { name: "Message templates" }), 1200);
    await s.caption("Each template shows its category, language and status", 1200);
    await shotNoToasts(s, "templates", p.getByRole("grid", { name: "WhatsApp templates" }).locator("xpath=ancestor::section[1]"), 0);

    await s.caption("Click New template", 500);
    await s.click(p.getByRole("button", { name: "New template" }), 1200);
    const editor = p.getByRole("dialog");
    await s.caption("Name it and write the body with variables", 500);
    await s.type(editor.getByRole("textbox", { name: "Template name" }), "emi_payment_link");
    const body = editor.getByLabel("Body", { exact: true });
    await body.click();
    await body.fill("Hi {{1}}, here is the UPI link for your EMI of ₹{{2}}: {{3}}");
    await body.press("End");
    await p.keyboard.type(". It is valid for 24 hours.", { delay: 45 });
    await s.pause(400);
    await s.caption("Give Meta a sample value for every variable", 500);
    await s.type(editor.getByRole("textbox", { name: "Example value for variable 1" }), "Rahul");
    await s.type(editor.getByRole("textbox", { name: "Example value for variable 2" }), "12,450");
    const link = editor.getByRole("textbox", { name: "Example value for variable 3" });
    await s.click(link, 100);
    await link.fill("https://pay.acme-lending.example/pl/8Hq2");
    await s.pause(400);
    await s.caption("Add a footer and a quick reply button", 500);
    await s.type(editor.getByRole("textbox", { name: "Template footer" }), "Acme Lending");
    await s.click(editor.getByRole("button", { name: "Add quick reply button" }), 500);
    await s.type(editor.getByRole("textbox", { name: "Button 1 text" }), "Paid");
    await s.caption("The preview shows the message as a WhatsApp bubble", 400);
    // Back to the top so the shot and the viewer see name, category, body and preview together.
    await editor.getByRole("textbox", { name: "Template name" }).evaluate((e) => e.scrollIntoView({ block: "center", behavior: "smooth" }));
    await s.pause(1200);
    await shotNoToasts(s, "new-template", editor, 0);
    await s.caption("Click Submit for review", 500);
    await s.click(editor.getByRole("button", { name: "Submit for review" }), 2200);
    await s.caption("It shows In review until Meta approves it", 1600);

    await s.caption("Send a test from a Ready template's menu", 500);
    await s.click(p.getByRole("button", { name: "Actions for emi_due_reminder" }).first(), 700);
    await s.click(p.getByRole("menuitem", { name: "Send test" }), 1000);
    const test = p.getByRole("dialog");
    await s.caption("Enter the recipient and fill every variable", 400);
    await s.type(test.getByRole("textbox", { name: "Recipient phone number" }), "+919876543210");
    for (const [i, v] of ["Rahul", "12,450", "PL-4821", "10 October"].entries()) {
      await s.type(test.getByRole("textbox", { name: `Variable ${i + 1} value` }), v);
    }
    await shotNoToasts(s, "send-test", test, 0);
    await s.caption("Click Send test", 400);
    await s.click(test.getByRole("button", { name: "Send test message" }), 2000);

    await s.caption("Add number offers a Ringg number or your own", 500);
    await s.click(p.getByRole("tab", { name: "Phone numbers" }), 700);
    await s.click(p.getByRole("button", { name: "Add phone number" }), 1600);
    await p.keyboard.press("Escape");
    await s.pause(600);
  },
} satisfies Scenario;
