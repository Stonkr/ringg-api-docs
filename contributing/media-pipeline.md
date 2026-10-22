# Docs media pipeline (`tools/docs-media`)

The pipeline drives the real dashboard UI in a headless browser, answers every backend call with fictional fixture data, and writes screenshots plus a captioned video for each scenario. No real account, backend or customer data is involved, so you can re-record any topic in minutes when the UI changes.

The folder is listed in `.mintignore`, so it is never published.

## Contents

- [What it produces](#what-it-produces)
- [One-time setup](#one-time-setup)
- [Run it](#run-it)
- [Write a scenario](#write-a-scenario)
- [Fixtures](#fixtures)
- [Ringg Analytics scenarios](#ringg-analytics-scenarios)
- [Review the output](#review-the-output)
- [Why it is built this way](#why-it-is-built-this-way)

## What it produces

Each scenario writes the following to `media/<scenario-name>/`:

| File | What it is |
|---|---|
| `video.webm` | AV1 in WebM, 60 fps, 1920 px wide, with captions and cursor burned in and a white title card first |
| `poster.webp` | The title card, so the player never shows an empty box |
| `captions.vtt` | Caption timings, kept for reference and search (captions are already in the picture) |
| `<shot>.webp` | Lossless screenshots from `s.shot()`, taken with the cursor and captions hidden |

A scenario with no `caption()` calls produces screenshots only. Raw frames, logs and timelines go to `$TMPDIR/ringg-docs-media/` and are deleted after encoding; they can reach gigabytes, so never move them into the repo.

## One-time setup

1. **Node 22.18 or newer.** `node run.ts` runs TypeScript directly through Node's built-in type stripping.
2. **ffmpeg with SVT-AV1.** `ffmpeg -hide_banner -encoders | grep libsvtav1` must print a line (Homebrew's `ffmpeg` includes it).
3. **Python 3 with Pillow** (`python3 -c "import PIL"`). WebP files are encoded with Pillow because neither Playwright nor ffmpeg's WebP output is used.
4. **Dependencies:**
   ```bash
   cd tools/docs-media
   pnpm install
   pnpm exec playwright install chromium
   ```
5. **A dashboard to record.** Serve a production build of the dashboard frontend repo from its `main` branch (what customers see) at `http://localhost:3201/dashboard`. A separate worktree keeps it apart from your working copy:
   ```bash
   cd <dashboard-repo>
   git worktree add --detach ../app-docs-media origin/main
   cd ../app-docs-media && cp ../<dashboard-repo>/.env . && pnpm install && pnpm build
   pnpm exec next start -p 3201
   ```
   Point at another server with `DASHBOARD_URL=http://host:port/dashboard`. When you finish, stop the server and run `git worktree remove ../app-docs-media`. A server left running keeps port 3201 busy and the worktree keeps showing up in your Git client.

## Run it

```bash
cd tools/docs-media
node run.ts agents-versions          # one scenario (by its `name`)
node run.ts agents-create agents-test # several
node run.ts                           # all of them (slow: tens of minutes)
node probe.ts /assistants             # open one route, list backend calls no fixture answers
```

Each scenario prints `✔ name: N shots, Ns video` or `✘ name: <error>`. On failure, a screenshot is saved to `$TMPDIR/ringg-docs-media/<name>-fail.png`. A line like `unanswered calls: GET /something` means the page asked for data no fixture provides. It received `{}`, so that part of the UI is probably empty in the recording; add the route and record again.

## Write a scenario

Add `scenarios/<topic>.ts`. The `name` must equal the file name and the `media/` folder name, and it is what the page's `src` paths use.

```ts
import type { Scenario } from "../run.ts";
import { AGENT_ID, editorARoutes, hideToasts } from "../fixtures/editor-a.ts";

export default {
  name: "agents-versions",
  docsPage: "documentation/build-agents/test-and-improve/drafts-and-versions", // repo path, no .mdx
  // title: "Drafts and versions",  // title card text; defaults to the page's sidebarTitle
  // highlight: true,               // outline targets; off by default (too distracting)
  routes: {
    ...editorARoutes(),
    "GET /analytics/version-analytics": { analytics: [/* fictional rows */] },
  },
  async run(s) {
    const p = s.page;
    await s.goto(`/assistants/${AGENT_ID}`);
    await hideToasts(p);
    await s.caption("Turn on Create Versions under Advanced Settings");
    await s.click(p.getByLabel("Toggle A/B testing"), 1800);
    await s.shot("version-bar", p.getByRole("button", { name: "Add new version" }).locator(".."), 12);
  },
} satisfies Scenario;
```

`docsPage` is the page's path from the repo root, without `.mdx`. When a scenario has no `title`, `run.ts` reads that page's `sidebarTitle` for the title card and fails if the file is missing, so update `docsPage` whenever a page moves. Set `title` when the sidebar label is too generic on its own ("Overview", "Logs") or would match another video's card.

`Session` API (`run.ts`):

| Call | Does |
|---|---|
| `s.goto(route)` | Opens a dashboard route (relative to `/dashboard`). The video starts once the first page is ready, not on a blank tab. |
| `s.caption(text, holdMs = 1600)` | Shows a caption for the steps that follow. Write it as an instruction ("Click + to add a version"), match the page's step wording, and keep it short enough to read in the hold time. |
| `s.click(locator, afterMs = 900)` / `s.type(locator, text)` / `s.hover(locator, ms)` | Moves the visible cursor smoothly to the target, then acts. Use these, not raw `locator.click()`, so the cursor movement shows in the video. |
| `s.pause(ms)` | Lets the viewer read a result. |
| `s.shot(name, locator?, padding = 16)` | Writes `media/<name>/<shot>.webp`, cropped to the locator (plus padding) or the full viewport. |

Guidelines:

- **Show the feature working, not a tour of empty screens.** Fill the forms, open the result and show the details that make the feature worth using (a Logs video opens a call's transcript, tool calls and analysis). Keep each video to the topic, usually 20 to 60 seconds.
- **Prefer role and label locators** (`getByRole`, `getByLabel`, `getByPlaceholder`). They survive restyles, and the dashboard puts `aria-label` on interactive elements.
- **Make the screenshots the page needs**, named for what they show (`assign-traffic`, `version-bar`), cropped to the relevant panel rather than the whole screen.
- **Hide anything that shouldn't be filmed.** Toasts, support chat and coachmarks are already hidden (`cleanPage`, the `COACHMARKS` list in `run.ts`). If a new coachmark appears, add its ID to that list.

## Fixtures

`fixtures/` holds the fictional data: `common.ts` (workspace "Acme Lending", user Priya Sharma, the routes every page needs to boot) plus one file per area (`agents.ts`, `editor-a.ts`, `campaigns.ts`, `numbers.ts`, `whatsapp.ts`, …). Route keys are `"METHOD /path"`, where the path is what follows `/api/backend`. A `*` matches one path segment, and a value can be a function `(url, body) => response` for responses that depend on the request.

- **Copy response shapes from the dashboard's types** in the dashboard frontend repo (`types/*.types.ts`, `lib/api/*.api.ts`) and say which type you followed in a comment. A wrong shape renders a broken UI, which then ends up in the docs.
- **Keep data fictional and consistent** with the shared cast. Use `.example` domains for every URL and email, phone numbers in the `+91987654xxxx` range, and the existing agent and workspace IDs. Never paste data from a real workspace, logs or a customer call.
- **Watch for internal details.** Before you commit, step through the video and check that nothing internal is visible: real names, real numbers, keys, internal URLs, or vendor and provider names that the product doesn't show customers.

## Ringg Analytics scenarios

Ringg Analytics ([analytics.ringg.ai](https://analytics.ringg.ai)) is a separate app with its own API under `/an/api/v0`. Its scenarios (`analytics-*`, `disputes-*`) set `analytics: { as: "<user>", fixture: "<scenario>" }` instead of `routes`, and replay `fixtures/analytics/<scenario>.json`:

- **Replay (the default).** Serve a production build of the analytics frontend repo at `http://localhost:3202` (or set `ANALYTICS_URL`) built with `NEXT_PUBLIC_API_URL` on the same origin, for example `http://localhost:3202/an/api/v0`. Every API call is answered from the fixture, so no backend is involved.
- **Recording a fixture.** Analytics responses are too varied to write by hand, so they are recorded once from an analytics backend that holds only fictional data (the Acme Lending cast, never a customer database). Set `ANALYTICS_RECORD_API=http://<host>/an/api/v0` and `ANALYTICS_RECORD_TOKENS=<file>`, a JSON file with `workspace_id` and `tokens: { "<user>": "<access token>" }`, then run the scenario: calls go to that server and the fixture is written when the run succeeds. Saves are recorded in order, so the scenario must make the same saves when it replays.
- **Call audio.** Every call plays `fixtures/analytics/call.mp3`, a synthesized, fictional conversation. `recording_url` and `media-url` are rewritten to it in both modes.
- **IDs.** `fixtures/analytics/ids.json` holds the fictional call, agent and appeal IDs the scenarios open.
- **Long panels.** The call page scrolls each column on its own. `s.shot(name, target, padding, true)` crops to the part of `target` visible in its scrolling panel.

Re-record a fixture whenever the screen it covers changes, and check it for internal details like any other media.

## Review the output

1. Play `media/<name>/video.webm` all the way through (Chrome, or another browser with AV1 support). Check that the captions match the actions, nothing is cut off, and no empty states or error toasts appear.
2. Open every `.webp` file and check that the crop is right and the text is sharp.
3. Run `pnpm dev` in the repo root and view the page, to check that the video plays with its poster and that the screenshots sit in the right steps.
4. Commit only `media/<name>/*` and the scenario or fixture changes.

## Why it is built this way

These decisions were deliberate; keep them unless there is a new reason:

- **Chrome screencast at 2× instead of Playwright's `recordVideo`.** `recordVideo` is 1× at about 1 Mbps and looked blurry. Frames are held until the next repaint and encoded at 60 fps so cursor movement stays smooth.
- **AV1 in WebM with no MP4 fallback.** It is about half the size of H.264 at the same quality; the earlier MP4 set totalled about 92 MB. Browsers play it natively with no custom player, but Safari needs AV1 hardware decoding.
- **A white title card in Inter (the dashboard font) as the first frame and poster.** A blank first frame looked broken.
- **Captions burned in rather than a `<track>`.** They always show, in the same style, with no player support needed.
- **Highlight rings off by default.** They were too distracting.
- **One folder per topic in `media/` with WebP images.** Every asset for a topic sits together and stays small.
