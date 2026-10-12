import type { Scenario } from "../run.ts";
import { workspace } from "../fixtures/common.ts";
import { AGENT_ID, editorARoutes, hideToasts } from "../fixtures/editor-a.ts";

// Workspace without KYC, so a new callee number goes through the WhatsApp code once; one number is verified already.
const noKycWorkspace = { ...workspace, is_kyc_done: false, verified_numbers: [{ number: "+919876543210", verified_at: "2026-09-12T10:00:00Z" }] };
// The placed call moves registered → ongoing → completed as the dialog polls it.
let placedAt = 0;
const callStatus = () => {
  const s = (Date.now() - placedAt) / 1000;
  return s < 3 ? "registered" : s < 8 ? "ongoing" : "completed";
};

export default {
  name: "agents-test",
  docsPage: "agents/test",
  routes: {
    ...editorARoutes(),
    "GET /workspace": { workspace_info: noKycWorkspace },
    "POST /workspace/otp/send": { status: "success", message: "OTP sent" },
    "POST /workspace/otp/verify": { status: "success", message: "Number verified" },
    "POST /calling/outbound/individual": () => {
      placedAt = Date.now();
      return { status: "success", message: "Call initiated", data: { call_id: "call_test_7781", call_direction: "outbound", call_status: "registered", initiated_at: new Date().toISOString(), agent_id: AGENT_ID } };
    },
    "GET /calling/history/v2": () => ({ calls: [{ id: "call_test_7781", status: callStatus() }], total_count: 1 }),
  },
  async run(s) {
    const p = s.page;
    await s.goto(`/assistants/${AGENT_ID}`);
    await hideToasts(p);
    await s.caption("Open the agent and click Test assistant", 900);
    await s.click(p.getByRole("button", { name: /Test assistant/ }), 1300);
    const d = p.getByRole("dialog");

    await s.caption("Three ways to test: Phone call, Web call, Live chat");
    await s.click(d.getByRole("tab", { name: "Web call" }), 1100);
    await s.shot("web-call-tab", d);
    await s.click(d.getByRole("tab", { name: "Live chat" }), 1200);
    await s.click(d.getByRole("tab", { name: "Phone call" }), 800);

    await s.caption("Choose the caller number: test or your own", 300);
    await s.click(d.locator('[data-slot="autocomplete-trigger"]').first(), 1600);
    await s.click(p.getByRole("option", { name: /98765 40000/ }), 700);

    await s.caption("Enter a callee number; verified ones are in the list", 300);
    await s.click(d.getByRole("button", { name: "Pick a verified number" }), 1300);
    await p.keyboard.press("Escape");
    await s.pause(300);
    await s.type(d.getByLabel("Callee number"), "9876543210");

    await s.caption("Fill in variables (optional)", 300);
    await s.type(d.getByLabel("Callee name"), "Priya");
    await s.type(d.getByLabel("Due amount"), "4,500");
    await s.type(d.getByLabel("Due date"), "15 October");
    await s.shot("phone-call-form", d);

    await s.caption("Smart formatter cleans up the name before the call", 300);
    await s.click(d.getByLabel("Enable smart formatter").locator("xpath=ancestor::label[1]"), 900);
    await s.click(d.getByRole("button", { name: "Smart formatter settings" }), 1600);
    await p.keyboard.press("Escape");
    await s.pause(300);
    await s.caption("cURL copies the same request for your backend", 300);
    await s.click(d.getByRole("button", { name: "Copy the cURL command" }), 1000);

    await s.caption("A new callee number? Verify it once by WhatsApp code", 300);
    await s.click(d.getByLabel("Callee number"), 200);
    await p.keyboard.press("ControlOrMeta+A");
    await p.keyboard.type("9876543277", { delay: 55 });
    await s.pause(400);
    await s.click(d.getByRole("button", { name: "Start a test call" }), 1300);
    await s.type(d.getByLabel("Verification code").locator("input").first().or(d.getByLabel("Verification code")).first(), "482913");
    await s.pause(1400);

    await s.caption("The call is placed; status updates live", 2000);
    await s.caption("Call details lists the variables sent", 300);
    await s.click(d.getByRole("button", { name: /Call details/ }), 1500);
    await s.shot("call-started", d);
    await s.pause(4500);
    await s.caption("When it ends, review the call in Logs", 1800);
  },
} satisfies Scenario;
