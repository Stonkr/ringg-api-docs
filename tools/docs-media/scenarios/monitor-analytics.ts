import type { Page } from "@playwright/test";
import type { Scenario } from "../run.ts";
import { analyticsRoutes } from "../fixtures/monitor-analytics.ts";

// Smoothly scrolls the page's content scroller so the section titled `heading` sits at the top.
async function scrollToSection(p: Page, heading: string | null, settleMs = 1400) {
  await p.evaluate((h) => {
    const scroller = document.querySelector("main h2")?.closest<HTMLElement>(".scroll-shadow");
    if (!scroller) return;
    const target = h ? [...scroller.querySelectorAll("h2")].find((e) => e.textContent?.trim() === h) : null;
    const top = target ? target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 8 : 0;
    scroller.scrollTo({ top, behavior: "smooth" });
  }, heading);
  await p.waitForTimeout(settleMs);
}

const section = (p: Page, heading: string) => p.locator("h2", { hasText: heading }).locator("xpath=..");

export default {
  name: "monitor-analytics",
  docsPage: "monitor/analytics",
  routes: { ...analyticsRoutes },
  async run(s) {
    const p = s.page;
    await s.goto("/analytics");
    await s.caption("Analytics totals your calls over a date range", 2200);
    await s.shot("overview", p.locator("main"));

    await s.caption("Click Filters", 600);
    await s.click(p.getByRole("button", { name: /^Filters/ }), 900);
    const panel = p.getByRole("dialog").first();
    await s.caption("Pick an agent to unlock goal metrics", 500);
    await s.click(panel.getByRole("button", { name: /^Assistants/ }), 700);
    await s.click(panel.getByText("Payment reminder", { exact: true }), 900);
    await p.mouse.click(700, 100);
    await s.pause(1200);

    await s.caption("Volume: calls, connectivity and handle time", 500);
    await s.hover(p.getByRole("button", { name: "Connectivity rate details" }), 2600);
    await p.mouse.move(700, 110, { steps: 10 });

    await s.caption("Performance: goal, cost per goal, latency", 400);
    await scrollToSection(p, "Performance");
    await s.pause(1600);
    await s.shot("performance", section(p, "Performance"), 4);
    await s.caption("Cohorts split connected calls by outcome", 400);
    await p.evaluate(() => document.querySelector("main h2")?.closest<HTMLElement>(".scroll-shadow")?.scrollBy({ top: 420, behavior: "smooth" }));
    await s.pause(2600);

    await s.caption("Call limits, agents and concurrency", 400);
    await scrollToSection(p, "Call limits");
    await s.pause(1400);
    await scrollToSection(p, "Trends");
    await s.pause(1200);

    await scrollToSection(p, null, 1200);
    await s.caption("Click a figure to drill into Logs", 500);
    await s.click(p.locator('a[aria-label="View connected calls in logs"]'), 2400);
    await s.caption("Logs opens with the matching filters", 2600);
    await s.shot("drill-down-logs", p.locator("main"));
  },
} satisfies Scenario;
