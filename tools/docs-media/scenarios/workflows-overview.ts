import type { Scenario } from "../run.ts";
import { workflowRoutes } from "../fixtures/workflows.ts";
import { logsRoutes } from "../fixtures/monitor.ts";

export default {
  name: "workflows-overview",
  title: "Workflows",
  docsPage: "workflows/overview",
  routes: { ...logsRoutes, ...workflowRoutes },
  async run(s) {
    const p = s.page;
    await s.goto("/workflows");
    await s.caption("Open Workflows from the sidebar", 1300);
    await s.shot("workflows-list", p.locator("main"));
    await s.caption("Active workflows can run; drafts are still in progress", 600);
    await s.hover(p.getByRole("link", { name: "Open KYC document chase" }), 900);
    await s.caption("Open a workflow to see its blocks", 400);
    await s.click(p.getByRole("link", { name: "Open Payment reminder follow-up" }), 1300);
    await p.getByRole("button", { name: "Fit to screen" }).first().click();
    await s.pause(700);
    await s.caption("Each block is a step: call, branch, act, wait, message", 2200);
    await s.caption("Every publish is a version; one is live", 400);
    await s.click(p.getByRole("button", { name: /^Workflow version v2/ }).first(), 1400);
    await p.keyboard.press("Escape");
    await s.pause(300);

    await s.goto("/logs/runs");
    await s.caption("Every run is recorded in Logs → Workflows", 1300);
    await s.shot("workflow-runs", p.locator("main"));
    await s.caption("Filter runs by status or workflow", 400);
    await s.click(p.getByRole("button", { name: "Filter by Status" }).first(), 1200);
    await p.keyboard.press("Escape");
    await s.pause(300);

    await s.caption("Click a run to see the path it took", 400);
    await s.click(p.getByRole("row").filter({ hasText: "Rahul Verma" }), 1600);
    const dlg = p.getByRole("dialog");
    await dlg.getByRole("button", { name: "Fit to screen" }).first().click();
    await s.pause(500);
    await dlg.getByRole("button", { name: "Zoom out" }).first().click();
    await s.pause(400);
    await s.caption("Click the Agent step to open its call", 400);
    await s.click(dlg.locator(".react-flow__node").filter({ hasText: "Payment reminder" }).first(), 1500);
    await s.caption("Recording, analysis and evals for that call", 1600);
    await s.click(dlg.getByRole("tab", { name: "Transcript" }), 1700);
    await s.caption("A Conditional step shows the branch the run took", 400);
    await s.click(dlg.getByText("Promised to pay?"), 1500);
    await s.shot("workflow-run-path", dlg, 0);
    await s.click(p.getByRole("button", { name: "Close workflow run" }), 700);

    await s.caption("A failed step shows the error that stopped the run", 400);
    await s.click(p.getByRole("row").filter({ hasText: "Arjun Mehta" }), 1400);
    await dlg.getByRole("button", { name: "Fit to screen" }).first().click();
    await s.pause(400);
    await dlg.getByRole("button", { name: "Zoom out" }).first().click();
    await s.pause(300);
    await s.click(dlg.getByText("Log promise in CRM"), 1900);
    await s.click(p.getByRole("button", { name: "Close workflow run" }), 700);

    await s.caption("Click a run's call count to see its calls in Logs", 400);
    await s.click(p.getByRole("button", { name: "View the 1 calls in run run_8f2a91" }), 2400);
  },
} satisfies Scenario;
