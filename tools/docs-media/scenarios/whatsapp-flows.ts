import type { Scenario } from "../run.ts";
import { shotNoToasts } from "../fixtures/editor-b.ts";
import { WA_ID, makeWhatsappEditorRoutes } from "../fixtures/whatsapp-agents.ts";
import { FEATURED_CHAT_ID, whatsappChatRoutes } from "../fixtures/whatsapp-chats.ts";
import { WA_ACCOUNT_ID } from "../fixtures/whatsapp.ts";
import { makeWhatsappFlowRoutes } from "../fixtures/whatsapp-flows.ts";

type Handler = unknown | ((url: URL, body: unknown) => unknown);
const answer = (value: Handler, url: URL, body: unknown) => (typeof value === "function" ? (value as (u: URL, b: unknown) => unknown)(url, body) : value);

// Logs and the agent editor each want their own answer for a few shared routes (the agent list, the account).
let section: "editor" | "logs" = "editor";
const editorRoutes = makeWhatsappEditorRoutes();
const chatRoutes = whatsappChatRoutes as Record<string, Handler>;
const sharedRoutes = Object.fromEntries(
  Object.keys(chatRoutes)
    .filter((key) => key in editorRoutes)
    .map((key) => [key, (url: URL, body: unknown) => answer(section === "logs" ? chatRoutes[key] : editorRoutes[key], url, body)]),
);

const SUBMISSION = [
  ["Your details", "Full name", "Priya Nair", "TextInput"],
  ["Your details", "Phone", "9876545012", "TextInput"],
  ["Visit details", "Project", "Green Acres Villas", "Dropdown"],
  ["Visit details", "Preferred visit date", "2026-10-10", "DatePicker"],
] as const;

// The featured chat, as a site visit booked through the Flow: the Flow message, the customer's response, the reply.
function flowChatDetails(url: URL) {
  const details = answer(chatRoutes["GET /chat/details"], url, undefined) as { data: Record<string, unknown> };
  if (url.searchParams.get("chat_id") !== FEATURED_CHAT_ID) return details;
  const start = new Date(details.data.initiation_time as string).getTime();
  const at = (seconds: number) => new Date(start + seconds * 1000).toISOString();
  const answers = SUBMISSION.map(([screen, label, value, component]) => ({ screen, label, value, component }));
  details.data.transcript = [
    { role: "user", text: "Hi, I'd like to visit Green Acres Villas next weekend", message_id: "wam_1", timestamp: at(0) },
    { role: "bot", text: "", flow: { name: "Site visit request", header_text: "", body_text: "Tap below to pick a date for your site visit.", footer_text: "", cta_text: "Book a visit" }, message_id: "wam_2", external_message_id: "wamid.out.002", timestamp: at(5) },
    { role: "user", text: `User submitted the WhatsApp Flow "Site visit request": ${answers.map((a) => `${a.label}=${a.value}`).join(", ")}`, flow_submission: { flow_name: "Site visit request", answers }, message_id: "wam_3", timestamp: at(71) },
    { role: "bot", text: "Thanks, Priya! You're down for a visit to Green Acres Villas on 10 October. Our team will call you to confirm the time.", message_id: "wam_4", timestamp: at(76) },
  ];
  return details;
}

// One video for the Flows page: the Flows tab and a Flow's details, adding it to an assistant, a template's Flow
// button, and the customer's response in Logs.
export default {
  name: "whatsapp-flows",
  docsPage: "documentation/build-agents/agents/whatsapp-agents/flows",
  routes: { ...chatRoutes, ...editorRoutes, ...sharedRoutes, ...makeWhatsappFlowRoutes(), "GET /chat/details": flowChatDetails },
  async run(s) {
    const p = s.page;
    const dialog = p.getByRole("dialog");
    await s.goto(`/integrations/whatsapp/${WA_ACCOUNT_ID}`);
    await s.caption("Your account's Flows tab lists every Flow, built in Ringg or in WhatsApp Manager", 500);
    await s.click(p.getByRole("tab", { name: "Flows" }), 1600);
    await shotNoToasts(s, "flows-tab", p.getByRole("grid", { name: "WhatsApp Flows" }), 8);

    await s.caption("Open a Flow: its details show a preview you can fill in", 400);
    await s.click(p.getByText("Site visit request", { exact: true }), 1400);
    await s.click(dialog.getByRole("button", { name: "Go to screen 2" }), 1400);
    await shotNoToasts(s, "flow-details", dialog, 0);
    await s.click(dialog.getByRole("button", { name: "Close" }).first(), 700);

    await s.goto(`/assistants/${WA_ID}`);
    await s.caption("In the WhatsApp assistant, select WhatsApp Flows, then Add flow", 400);
    await s.click(p.getByRole("button", { name: "Navigate to WhatsApp Flows" }), 1200);
    await s.click(p.getByRole("button", { name: "Add flow" }).first(), 1200);
    await s.caption("Pick a published Flow", 400);
    await s.click(p.getByRole("button", { name: "Add the Site visit request flow" }), 1200);
    await s.caption("Write the message and button that carry it", 400);
    await s.type(dialog.getByRole("textbox", { name: "Message" }), "Tap below to pick a date for your site visit.");
    await s.type(dialog.getByRole("textbox", { name: "Button label" }), "Book a visit");
    await s.caption("Say when it's useful. It opens on its first screen", 400);
    await s.type(dialog.getByRole("textbox", { name: "When to send" }), "When the customer wants to visit a project.");
    await shotNoToasts(s, "flow-setup", dialog, 0);
    await s.caption("Click Save", 400);
    await s.click(dialog.getByRole("button", { name: "Save Flow" }), 1800);
    await s.caption("Tag it in the prompt with @ so the assistant knows when to send it", 2000);

    await s.goto(`/integrations/whatsapp/${WA_ACCOUNT_ID}`);
    await s.caption("To start the chat yourself, put the Flow on a template", 400);
    await s.click(p.getByRole("tab", { name: "Message templates" }), 900);
    await s.click(p.getByRole("button", { name: "New template" }), 1100);
    const body = dialog.getByLabel("Body", { exact: true });
    await s.click(body, 200);
    await body.fill("Thanks for your interest in Green Acres Villas. Tap below to book a site visit at a time that suits you.");
    await s.pause(500);
    await s.caption("Under Buttons, add a Flow button and pick the Flow", 400);
    await s.click(dialog.getByRole("button", { name: "Add Flow button" }), 700);
    await s.type(dialog.getByRole("textbox", { name: "Flow button text" }), "Book a visit");
    await s.click(dialog.getByRole("button", { name: /Pick a published Flow/ }), 600);
    await s.click(p.getByRole("option", { name: /Site visit request/ }), 1000);
    await dialog.getByRole("textbox", { name: "Flow button text" }).evaluate((e) => e.scrollIntoView({ block: "center", behavior: "smooth" }));
    await s.pause(900);
    await shotNoToasts(s, "template-flow-button", dialog, 0);
    await p.keyboard.press("Escape");
    await s.pause(500);

    section = "logs";
    await s.goto("/logs/whatsapp");
    await s.caption("In Logs, the customer's answers show as Response sent", 400);
    await s.click(p.getByText("Priya Nair", { exact: true }), 1600);
    await s.click(p.getByRole("tab", { name: "Transcript" }), 1600);
    await s.caption("Click View response to see every answer, by screen", 400);
    await s.click(p.getByRole("button", { name: "View the response to Site visit request" }), 1600);
    await shotNoToasts(s, "flow-response", p.getByRole("dialog").last(), 0);
    await p.keyboard.press("Escape");
    await s.pause(500);
  },
} satisfies Scenario;
