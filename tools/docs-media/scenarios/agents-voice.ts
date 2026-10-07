import type { Scenario } from "../run.ts";
import { workspace } from "../fixtures/common.ts";
import { AGENT_ID, editorARoutes, stubVoicePreviews } from "../fixtures/editor-a.ts";

// Voice cloning on for the workspace, so Clone a voice is offered.

export default {
  name: "agents-voice",
  docsPage: "agents/voice-and-language",
  routes: {
    ...editorARoutes(),
    "GET /workspace": { workspace_info: { ...workspace, is_voice_clone_enabled: true } },
  },
  async run(s) {
    const p = s.page;
    await stubVoicePreviews(p);
    await s.goto(`/assistants/${AGENT_ID}`);

    await s.caption("Open Voice in the editor sidebar", 800);
    await s.click(p.getByText("Voice", { exact: true }).first(), 1500);

    await s.caption("Change the primary language");
    await s.click(p.getByRole("button", { name: /Primary language/ }), 900);
    await s.click(p.getByRole("option", { name: "Hindi" }), 1000);
    await s.caption("Pick a secondary language the agent can switch to");
    await s.click(p.getByRole("button", { name: /Secondary language/ }), 900);
    await s.click(p.getByRole("option", { name: "English (India)" }), 900);
    await s.caption("Add more languages callers may speak", 300);
    await s.click(p.getByRole("button", { name: "Add more languages" }), 700);
    const additional = p.getByRole("button", { name: /Additional languages/ });
    await s.click(additional, 800);
    await s.click(p.getByRole("option", { name: "Marathi" }), 700);
    // Close by clicking the trigger again (Escape would drop the pick).
    await s.click(additional, 500);

    await s.caption("Filter voices by provider and tag");
    await s.click(p.getByText("Sarvam", { exact: true }), 900);
    await s.click(p.getByText("Friendly", { exact: true }).first(), 1000);

    await s.caption("Click a voice to select it and hear its preview");
    await s.click(p.getByText("Meera", { exact: true }), 1800);
    await s.shot("voice-grid");

    await s.caption("Clone a voice from a short MP3 sample", 300);
    await s.click(p.getByRole("button", { name: "Clone a voice" }), 900);
    await s.type(p.getByLabel("Voice name"), "Priya studio");
    const { readFileSync } = await import("node:fs");
    await p.locator('input[type="file"]').setInputFiles({ name: "priya-sample.mp3", mimeType: "audio/mpeg", buffer: readFileSync(new URL("../fixtures/editor-a-preview.mp3", import.meta.url)) });
    await s.pause(1200);
    await s.click(p.getByRole("button", { name: "Cancel cloning voice" }), 700);

    await s.caption("Set the voice speed and play it back");
    await s.click(p.getByText("0.9x", { exact: true }), 700);
    await s.click(p.getByRole("button", { name: /voice preview/ }), 1500);

    await s.caption("Click Save");
    await s.click(p.getByRole("button", { name: "Save voice settings" }), 2000);
    await s.shot("voice-speed", p.getByText("Adjust the speaking speed of your assistant.").locator("xpath=ancestor::div[.//button[@aria-label='Save voice settings']][1]"));
    await s.caption("Saved: the next call uses Meera in Hindi at 0.9x", 2200);
  },
} satisfies Scenario;
