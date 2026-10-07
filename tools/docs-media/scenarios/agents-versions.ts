import type { Scenario } from "../run.ts";
import { AGENT_ID, editorARoutes, hideToasts } from "../fixtures/editor-a.ts";

export default {
  name: "agents-versions",
  docsPage: "agents/versions",
  routes: {
    ...editorARoutes(),
    // A/B Analytics: last 7 days per version (values keyed by version slug).
    "GET /analytics/version-analytics": {
      analytics: [
        { analytics_key: "total_calls", analytics_label: "Total calls", unit: "", v1: 412, v2: 176 },
        { analytics_key: "connected_rate", analytics_label: "Connected rate", unit: "%", v1: 68, v2: 74 },
        { analytics_key: "avg_duration", analytics_label: "Avg. call duration", unit: "s", v1: 112, v2: 87 },
        { analytics_key: "promise_to_pay", analytics_label: "Promise-to-pay rate", unit: "%", v1: 41, v2: 52 },
        { analytics_key: "avg_cost", analytics_label: "Avg. cost per call", unit: " credits", v1: 4.2, v2: 3.4 },
      ],
    },
  },
  async run(s) {
    const p = s.page;
    await s.goto(`/assistants/${AGENT_ID}`);
    await hideToasts(p);
    const addVersion = p.getByRole("button", { name: "Add new version" });
    const versionBar = addVersion.locator("xpath=ancestor::div[.//*[normalize-space()='v1']][1]");

    await s.caption("Turn on Create Versions under Advanced Settings");
    await s.click(p.getByLabel("Toggle A/B testing"), 1800);
    await s.caption("A version bar appears above the editor, showing V1", 1400);
    await s.hover(versionBar, 900);

    await s.caption("Click + to add a version");
    await s.click(addVersion, 1800);
    await s.shot("version-bar", versionBar, 12);

    await s.caption("Click a version to switch to it");
    await s.click(p.getByText(/^v2$/i), 1500);

    await s.caption("Open its menu to add notes or copy its ID");
    const v2Chip = p.getByText(/^v2$/i).locator("xpath=..");
    await s.click(v2Chip.getByRole("button"), 900);
    await s.type(p.getByPlaceholder("Add notes about this version..."), "Shorter first message");
    await s.pause(500);
    await s.click(p.getByPlaceholder("Add notes about this version...").locator("xpath=ancestor::div[.//button][1]//button").last(), 1200);
    await p.keyboard.press("Escape");
    await s.pause(500);

    await s.caption("Click the gear, then Assign Traffic");
    await s.click(addVersion.locator("xpath=following::button[1]"), 900);
    await s.click(p.getByRole("menuitem", { name: "Assign Traffic" }), 1400);

    await s.caption("Set each version's share; the total must be 100%");
    const sliders = p.getByRole("dialog").getByRole("slider");
    await s.hover(sliders.nth(0), 400);
    await sliders.nth(0).focus();
    for (let i = 0; i < 6; i++) { await p.keyboard.press("ArrowLeft"); await s.pause(180); }
    await s.hover(sliders.nth(1), 400);
    await sliders.nth(1).focus();
    for (let i = 0; i < 6; i++) { await p.keyboard.press("ArrowRight"); await s.pause(180); }
    await s.pause(600);
    await s.shot("assign-traffic", p.getByRole("dialog"));

    await s.caption("Click Save");
    await s.click(p.getByRole("dialog").getByRole("button", { name: "Save" }), 1600);
    await s.caption("Both versions now get calls: 70% and 30%", 1800);
    await s.hover(versionBar, 900);
    await s.caption("Compare versions: gear, then View Analytics", 300);
    await s.click(addVersion.locator("xpath=following::button[1]"), 800);
    await s.click(p.getByRole("menuitem", { name: "View Analytics" }), 2200);
    await p.keyboard.press("Escape");
    await s.pause(500);
    await s.caption("Finalize picks the winner when the test is done", 1400);
    await s.hover(p.getByRole("button", { name: /Finalize/ }), 1200);
  },
} satisfies Scenario;
