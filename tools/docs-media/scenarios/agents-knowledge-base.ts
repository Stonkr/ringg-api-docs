import type { Scenario } from "../run.ts";
import { AGENT_ID, editorARoutes } from "../fixtures/editor-a.ts";

export default {
  name: "agents-knowledge-base",
  docsPage: "agents/knowledge-base",
  routes: editorARoutes({ kbIds: [] }),
  async run(s) {
    const p = s.page;
    await s.goto(`/assistants/${AGENT_ID}`);

    await s.caption("Open Knowledge Base in the editor sidebar", 800);
    await s.click(p.getByText("Knowledge Base", { exact: true }).first(), 1300);

    await s.caption("Click Select Knowledge Base and tick one or more");
    await s.click(p.getByText("Select Knowledge Base").first(), 1000);
    await s.click(p.getByText("EMI payment FAQ", { exact: true }), 1200);
    await s.click(p.getByText("Loan policy 2026", { exact: true }), 1000);
    await s.caption("Add Knowledge Base opens the page to create one", 300);
    await s.hover(p.getByText("Add Knowledge Base", { exact: true }), 1400);
    await s.click(p.getByText("Please select the knowledge base(s)."), 800);
    await s.caption("Attached knowledge bases are listed under the button", 1400);
    const panel = p.getByText("Please select the knowledge base(s).").locator("xpath=..");
    await s.hover(panel, 900);
    await s.shot("attached", panel, 12);
    await s.caption("Detach one with its bin icon", 300);
    await s.hover(p.getByRole("button", { name: "Detach Loan policy 2026 knowledge base" }), 1300);

    await s.caption("Mention it in the prompt: type @ and pick it");
    const rules = p.locator('[contenteditable="true"]').nth(4).locator("p").last();
    await s.hover(rules, 300);
    const b = (await rules.boundingBox())!;
    await rules.click({ position: { x: b.width - 3, y: b.height / 2 } });
    await p.keyboard.press("End");
    await p.keyboard.type(" For interest, charges or eligibility, answer from ", { delay: 40 });
    await p.keyboard.type("@", { delay: 45 });
    await s.pause(1200);
    await s.shot("kb-in-menu", p.locator("div[class*='max-h-[350px]']").last(), 40);
    await p.keyboard.type("policy", { delay: 110 });
    await s.pause(800);
    await p.keyboard.press("Enter");
    await p.keyboard.type(".", { delay: 45 });
    await s.pause(800);

    await s.caption("Click Save");
    await s.click(p.getByRole("button", { name: "Save prompt changes" }), 1800);
    await s.caption("The agent now answers policy questions from it", 1800);
    await s.hover(rules, 1000);
  },
} satisfies Scenario;
