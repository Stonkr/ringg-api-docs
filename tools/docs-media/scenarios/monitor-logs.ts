import type { Scenario } from "../run.ts";
import { logsRoutes } from "../fixtures/monitor.ts";
import { workflowRoutes } from "../fixtures/workflows.ts";

// Logs → Workflows reads the workflow runs list from the workflows fixtures.
const runsRoutes = Object.fromEntries(["GET /workflow/runs", "GET /workflow/runs/*/trace", "GET /workflow", "GET /workflow/*", "GET /workflow/*/versions"].map((k) => [k, (workflowRoutes as Record<string, unknown>)[k]]));

export default {
  name: "monitor-logs",
  docsPage: "monitor/logs",
  routes: { ...logsRoutes, ...runsRoutes },
  async run(s) {
    const p = s.page;
    await s.goto("/logs");
    await s.caption("Logs lists every call your agents handled", 1800);
    await s.shot("call-list", p.locator("main"));

    await s.caption("Expand a retried call to see each attempt", 400);
    await s.click(p.getByRole("button", { name: "Expand attempts" }).first(), 1600);

    await s.caption("Click Filters", 400);
    await s.click(p.getByRole("button", { name: /^Filters/ }), 800);
    const panel = p.getByRole("dialog").first();
    await s.caption("Pick a date range", 400);
    await s.click(panel.getByText("Week", { exact: true }), 600);
    await s.caption("Choose an assistant", 400);
    await s.click(panel.getByRole("button", { name: /^Assistants/ }), 500);
    await s.click(panel.getByText("Payment reminder", { exact: true }), 600);
    await s.caption("Narrow by call status", 400);
    await s.click(panel.getByRole("button", { name: /^Call status/ }), 500);
    await s.click(panel.getByText("Completed", { exact: true }), 700);
    await p.keyboard.press("Escape");
    await s.pause(600);
    await s.caption("Applied filters show as chips", 1400);

    await s.caption("Click a call to open it", 400);
    await s.click(p.getByText("Rahul Verma", { exact: true }), 1800);
    await s.caption("Recording, latency, variables and analysis", 2000);
    const callPanel = p.getByRole("tablist", { name: "Call analysis sections" }).locator("xpath=ancestor::*[.//button[@aria-label='Call actions']][1]");
    await s.shot("call-details", callPanel, 2);

    await s.caption("Open Advanced analysis", 400);
    await s.click(p.getByRole("tab", { name: "Advanced analysis" }), 1300);

    await s.caption("Read the transcript", 400);
    await s.click(p.getByRole("tab", { name: "Transcript" }), 1600);
    await s.shot("transcript", callPanel, 2);

    await s.caption("Click a tool call to see its request and response", 400);
    await s.click(p.getByRole("button", { name: /Fetch Loan Details/ }), 1400);
    await s.click(p.getByRole("tab", { name: "Request" }), 1300);
    await s.shot("tool-call", callPanel, 2);
    await p.keyboard.press("Escape");
    await s.pause(300);

    await s.caption("Tools run before, during and after the call", 400);
    await p.evaluate(() => {
      const panel = [...document.querySelectorAll<HTMLElement>("[role=tabpanel]")].find((e) => e.offsetParent);
      const scroller = [panel, ...panel!.querySelectorAll<HTMLElement>("*")].find((e) => e && e.scrollHeight > e.clientHeight + 40 && getComputedStyle(e).overflowY !== "visible");
      scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    });
    await s.pause(2200);

    await s.caption("Evals score the call, metric by metric", 400);
    await s.click(p.getByRole("tab", { name: "Evals" }), 1900);

    // Close the drawer by clicking outside it (a mouse click leaves no keyboard focus ring).
    await p.mouse.click(700, 80);
    await s.pause(700);
    await s.caption("Export the list by email", 400);
    await s.click(p.getByRole("button", { name: "Export" }), 700);
    await s.click(p.getByRole("menuitem", { name: "Export with analysis" }), 300);
    // Drop the caption bar so the "sent to your email" toast is readable.
    await p.evaluate(() => (window as any).__docs?.caption(""));
    await s.pause(1600);

    await s.caption("WhatsApp: the same view for chats", 400);
    await s.click(p.getByRole("tab", { name: "Show WhatsApp" }), 900);
    await s.click(p.getByText("Priya Nair", { exact: true }), 1200);
    await s.click(p.getByRole("tab", { name: "Transcript" }), 1800);
    await p.mouse.click(700, 80);
    await s.pause(500);

    await s.caption("Workflows: one row per workflow run", 400);
    await s.click(p.getByRole("tab", { name: "Show Workflows" }), 1800);
  },
} satisfies Scenario;
