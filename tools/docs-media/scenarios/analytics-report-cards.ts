import type { Scenario } from "../run.ts";

// A team lead opens an agent's report card and leaves a coaching note on a parameter.
export default {
  name: "analytics-report-cards",
  docsPage: "analytics-platform/coach-agents/report-cards",
  routes: {},
  analytics: { as: "kavya", fixture: "analytics-report-cards" },
  async run(s) {
    const p = s.page;
    await s.goto("/agents");
    await p.getByText("Arjun Mehta").first().waitFor();
    await s.caption("Open Agents and click an agent in your team");
    await s.click(p.getByRole("cell", { name: "Arjun Mehta" }), 1800);
    await p.getByRole("heading", { name: "Arjun Mehta" }).waitFor();
    await s.caption("The report card compares this period with the one before", 2400);
    await s.page.mouse.move(1300, 20); // no hover states in the shot
    await s.shot("report-card");
    await s.caption("Click Coach on a parameter to leave a note");
    await s.click(p.getByRole("button", { name: "Coach" }).first());
    await s.type(p.getByPlaceholder("What should they do differently?"), "Say the customer's name in your first line, every call.");
    await s.click(p.getByRole("button", { name: "Post note" }), 1200);
    await p.getByText("Not read yet").first().waitFor();
    await s.caption("Arjun sees the note on his report card", 2000);
    await s.page.mouse.move(1300, 20);
    await s.shot("coaching", p.locator("#coaching"));
  },
} satisfies Scenario;
