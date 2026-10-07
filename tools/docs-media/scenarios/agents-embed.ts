import type { Scenario } from "../run.ts";
import { BASE, cleanPage } from "../lib.ts";
import { makeEditorBRoutes, PR_ID, shotNoToasts } from "../fixtures/editor-b.ts";

// Published versions of the web widget (the page reads them from the npm registry).
const CDN_VERSIONS = ["1.0.12", "1.0.11", "1.0.10", "1.0.9"];

export default {
  name: "agents-embed",
  docsPage: "agents/embed-and-widgets",
  routes: makeEditorBRoutes(),
  async run(s) {
    const p = s.page;
    await p.route("https://registry.npmjs.org/**", (r) => r.fulfill({ json: { name: "@desivocal/agents-cdn", versions: Object.fromEntries(CDN_VERSIONS.map((v) => [v, {}])) } }));
    await p.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const tab = (name: string) => p.getByRole("tab", { name: `${name} tab` }).or(p.getByRole("button", { name: `${name} tab` })).first();

    // The snippet reads its mode from the page's host: on localhost it adds mode "stage". A *.localhost
    // name containing "ringg.ai" resolves to this machine and renders the production snippet.
    await p.goto(`${BASE.replace("//localhost", "//ringg.ai.localhost")}/assistants/${PR_ID}`, { waitUntil: "networkidle" });
    await cleanPage(p);
    await s.pause(600);
    await p.mouse.move(720, 450);
    s.readyAt = Date.now();
    await s.caption("Open Embed & Widgets", 800);
    await s.click(p.getByRole("button", { name: "Navigate to Embed & Widgets" }), 1400);

    await s.caption("Components the agent shows in conversation", 1200);
    await shotNoToasts(s, "components", p.locator("main").last());
    await s.caption("Click New component to start from a template", 500);
    await s.click(p.getByRole("button", { name: /New component/ }).first(), 1000);
    await s.click(p.getByText("Lead form", { exact: true }), 1200);

    await s.caption("Shape it in the builder; the preview is live", 500);
    await s.click(p.locator('[aria-label="Select Phone block"]'), 1300);
    await s.click(p.getByText("In chat", { exact: true }), 1200);

    await s.caption("Or describe a change to the AI builder", 500);
    await s.click(p.getByRole("button", { name: "Switch to Chat mode" }), 600);
    await s.type(p.getByLabel("Describe a change"), "Add a date picker for the callback date");
    await p.keyboard.press("Enter");
    await s.pause(2200);

    await s.caption("Name it and click Save", 500);
    await s.type(p.getByLabel("Widget display name").locator("input").or(p.getByLabel("Widget display name")).first(), "Callback request");
    await s.click(p.getByRole("button", { name: "Save widget" }), 1200);
    await s.click(p.getByRole("button", { name: "Close builder" }), 900);
    await s.caption("Mention it in the prompt as @[[callback_request]]", 1500);

    await s.caption("Style the widget under Appearance", 600);
    await s.click(tab("Appearance"), 1200);
    await s.click(p.getByRole("button", { name: "Select blue theme preset" }), 1000);
    await s.click(p.getByRole("button", { name: "Toggle Branding" }), 800);
    await s.type(p.getByPlaceholder("Ringg AI Support"), "Acme Lending Help");
    await s.type(p.getByPlaceholder("24/7 voice support..."), "Ask about your EMI or loan");
    await p.getByText("Widget appearance", { exact: true }).click();
    await s.caption("The preview updates as you change it", 1500);
    await shotNoToasts(s, "appearance", p.locator("main").last());

    await s.caption("Copy the snippet from Install & domains", 600);
    await s.click(tab("Install & domains"), 300);
    await s.pause(900);
    await s.click(p.getByRole("button", { name: "Copy", exact: true }), 900);
    await s.caption("Flutter apps get their own setup", 400);
    await s.click(p.getByRole("tab", { name: "Flutter" }), 1500);
    await s.click(p.getByRole("tab", { name: "Web" }), 300);
    await s.pause(500);

    await s.caption("Allow your site under Allowed clients", 600);
    await s.type(p.getByPlaceholder("example.com, android://com.example.app"), "app.acme-lending.example");
    await s.click(p.getByRole("button", { name: "Add allowed client" }), 300);
    await s.pause(1200);
    await shotNoToasts(s, "install", p.locator("main").last());
    await s.pause(800);
  },
} satisfies Scenario;
