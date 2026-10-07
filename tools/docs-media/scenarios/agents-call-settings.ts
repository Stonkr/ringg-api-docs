import type { Scenario } from "../run.ts";
import { makeEditorBRoutes, PR_ID, shotNoToasts } from "../fixtures/editor-b.ts";

export default {
  name: "agents-call-settings",
  docsPage: "agents/call-settings",
  routes: makeEditorBRoutes(),
  async run(s) {
    const p = s.page;
    const section = (title: string) => p.locator(`xpath=//h3[normalize-space()="${title}"]/ancestor::div[contains(@class,"md:flex-row")][1]`);
    const option = (text: string) => p.locator('[role="option"]').filter({ hasText: new RegExp(`^${text}$`) }).locator("visible=true").first();
    // The HeroUI switch's own <label> wraps its hidden input; clicking it toggles.
    const toggleRow = (label: string) => p.locator("label").filter({ has: p.getByRole("switch", { name: label, exact: true }) }).first();

    await s.goto(`/assistants/${PR_ID}`);
    await s.caption("Open the agent and select Call", 900);
    await s.click(p.getByRole("button", { name: "Navigate to Call" }), 1200);

    await s.caption("Cap how often one person is called", 500);
    await s.click(section("Call limits").getByRole("button").first(), 600);
    await s.click(option("2 calls"), 1000);

    await s.caption("Set the maximum call duration", 500);
    await s.click(p.getByLabel("Maximum call duration"), 600);
    await s.click(option("7 minutes"), 900);

    await s.caption("Set when the agent checks in and hangs up", 500);
    await s.click(p.getByLabel("Inactivity duration"), 600);
    await s.click(option("30 seconds"), 800);
    await s.click(p.getByLabel("Inactivity warning"), 600);
    await s.click(option("15 seconds"), 900);
    await shotNoToasts(s, "call-duration", section("Call duration"));

    await s.caption("Set the calling window", 500);
    await s.click(section("Calling window").getByRole("button").nth(1), 600);
    await s.click(option("20:00"), 900);

    await s.caption("Turn on voicemail options", 500);
    await s.click(toggleRow("Leave voicemail message"), 1000);
    await shotNoToasts(s, "voicemail", section("Voicemail"));
    await s.caption("Replace the summary with your own message", 500);
    await s.click(p.getByRole("button", { name: "Edit custom voicemail message" }), 600);
    await s.type(p.getByRole("textbox", { name: "Custom voicemail message" }), "Hi, this is Acme Lending. Please call us back about your EMI.");
    await s.click(p.getByRole("button", { name: "Save custom voicemail message" }), 1100);

    await s.caption("Choose the interruption sensitivity", 500);
    await s.click(section("Interruption sensitivity").getByText("Strict", { exact: true }), 1000);
    await shotNoToasts(s, "interruption-sensitivity", section("Interruption sensitivity"));

    await s.caption("Add background audio and a graceful exit", 500);
    await s.click(toggleRow("Enable background audio"), 1000);
    await s.click(toggleRow("Enable graceful exit warning"), 1000);
    await s.hover(section("Other settings"), 900);

    await s.caption("Chat sessions have their own limits", 300);
    await s.click(p.getByRole("button", { name: "Navigate to Chat" }), 1800);
    await s.caption("Each change saves as soon as you make it", 1500);
  },
} satisfies Scenario;
