import type { Scenario } from "../run.ts";
import { alertsRoutes, resetAlerts } from "../fixtures/monitor-alerts.ts";

export default {
  name: "monitor-alerts",
  docsPage: "monitor/alerts",
  routes: { ...alertsRoutes },
  async run(s) {
    resetAlerts();
    const p = s.page;
    await s.goto("/alerts");
    await s.caption("Alerts watch a metric and notify you", 2000);
    await s.shot("alerts-list", p.locator("main"));
    await s.caption("Recommended starter alerts turn on with Enable", 400);
    await s.hover(p.getByRole("button", { name: /Enable/ }).first(), 1600);

    await s.caption("Click Create alert", 500);
    await s.click(p.getByRole("button", { name: "Create alert" }), 1000);
    const d = p.getByRole("dialog");
    // Options of the dialog's selects render in a popover outside the dialog; CSS locators reach them.
    const option = (text: string) => p.locator("[role=option]", { hasText: text });

    await s.caption("Name it and pick the scope", 400);
    await s.type(d.getByRole("textbox", { name: "Alert name" }), "Call failure rate spike");
    await s.hover(d.getByText("Workspace", { exact: true }), 900);

    await s.caption("Set the trigger", 400);
    await s.click(d.locator("button[aria-label=Window]"), 600);
    await s.click(option("1 hour"), 600);
    await s.click(d.locator("button[aria-label=Metric]"), 900);
    await s.click(option("Call failure rate"), 900);
    await s.hover(d.locator("input[aria-label=Threshold]"), 1000);

    await s.caption("Choose who to notify", 400);
    await s.click(d.getByText("Email", { exact: true }), 500);
    await s.type(d.getByRole("textbox", { name: "Email address" }), "ops@acme-lending.example");
    await s.click(d.getByRole("button", { name: "Confirm email" }), 700);
    await s.click(d.getByText("Webhook", { exact: true }), 600);
    await s.type(d.getByRole("textbox", { name: "Webhook URL" }), "https://hooks.acme-lending.example/ringg-alerts");
    await s.click(d.getByRole("button", { name: "Test webhook" }), 1600);
    await s.click(d.getByRole("button", { name: "Confirm webhook" }), 900);
    await s.shot("create-alert-dialog", d, 4);

    await s.caption("Click Save", 400);
    await s.click(d.getByRole("button", { name: "Save alert" }), 1800);
    await s.caption("The new alert is on", 1800);

    await s.caption("Agent alerts watch one agent, even its tool calls", 400);
    await s.click(p.getByLabel(/^Agent alerts/).first(), 1600);
    await s.caption("Turn an alert off or on with its switch", 400);
    // The switch's input is visually hidden, so the click lands on it directly after the cursor arrives.
    const toggle = p.getByLabel("Toggle Payment link tool failing").first();
    await s.hover(toggle, 200);
    await toggle.click({ force: true });
    await p.mouse.move(1300, 420, { steps: 12 });
    await s.pause(1200);
  },
} satisfies Scenario;
