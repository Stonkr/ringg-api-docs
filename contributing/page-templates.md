# Page templates

Copy the template for the page type, then replace every placeholder. Each template mirrors pages already in the repo; when unsure, open the example named under it and match it.

## Contents

- [Guide page (Documentation)](#guide-page-documentation)
- [Video and screenshot blocks](#video-and-screenshot-blocks)
- [API endpoint page](#api-endpoint-page)
- [Lesson (Resources → Learn)](#lesson-resources--learn)
- [Related topics block (feature families)](#related-topics-block-feature-families)
- [Changelog entry](#changelog-entry)

## Guide page (Documentation)

Example: `documentation/build-agents/test-and-improve/drafts-and-versions.mdx`.

````mdx
---
title: "Drafts and versions"
sidebarTitle: "Drafts and versions"
description: "One sentence, about 150 characters, naming what the reader can do here, with the product's real terms in it."
"og:title": "Agent drafts, versions and A/B testing in Ringg AI"
---

What it is and when to use it, in one or two sentences. Say when not to use it if readers commonly confuse it with something else.

In the dashboard: **Sidebar → Assistants →** open an agent.

## Before you start

<Columns cols={2}>
  <Card title="An agent" icon="bot" href="/documentation/build-agents/agents/create-an-agent" horizontal>
    One line on why it's needed.
  </Card>
  <Card title="An API key" icon="key" href="/documentation/manage-account/api-key" horizontal>
    Optional: only for the API part.
  </Card>
</Columns>

## <Task in sentence case>

One sentence saying what the video shows.

<Frame caption="…">
  <video …/>  <!-- exact block in "Video and screenshot blocks" below -->
</Frame>

<Steps>
  <Step title="Short imperative title">
    What to click, in **bold UI labels**, and what appears. Quote exact on-screen messages.
  </Step>
  <Step title="…">
    …

    <Check>What the reader sees when it worked, and where to confirm it.</Check>
  </Step>
</Steps>

## <Rules, limits or reference table>

| | Option A | Option B |
|---|---|---|

## Next steps

<Columns cols={3}>
  <Card title="…" icon="…" href="…">One line.</Card>
  <Card title="…" icon="…" href="…">One line.</Card>
  <Card title="…" icon="…" href="…">One line.</Card>
</Columns>
````

Notes:

- **Before you start** lists real prerequisites only, usually 1 to 3 cards. Mark optional ones "Optional:".
- **Next steps** has 2 to 3 cards for where a reader naturally goes next, not a repeat of the sidebar and not external links. A provider's own docs or support can be linked inline where they are needed.
- Card icons come from Lucide (`docs.json → icons.library`); use the icon's Lucide name.
- For an API part inside a guide, use a `<CodeGroup>` with cURL, JavaScript and Python. Read the key from `$RINGG_API_KEY` / `process.env.RINGG_API_KEY` / `os.environ["RINGG_API_KEY"]`, use base URL `https://prod-api.ringg.ai/ca/api/v0` and header `X-API-KEY`.

## Video and screenshot blocks

Video (replace `<topic>` and both caption strings; the caption, `alt` and `aria-label` are identical):

```mdx
<Frame caption="Adding a version and splitting traffic in the dashboard">
  <video alt="Adding a version and splitting traffic in the dashboard" aria-label="Adding a version and splitting traffic in the dashboard" controls muted playsInline className="w-full rounded-xl" style={{ aspectRatio: "16 / 10" }} preload="metadata" controlsList="nodownload noremoteplayback" poster="/media/<topic>/poster.webp">
    <source src="/media/<topic>/video.webm" type='video/webm; codecs="av01.0.09M.08"' />
  </video>
</Frame>
```

Screenshot (alt text describes what is on screen, specifically):

```mdx
<Frame caption="Assign Traffic with a 70/30 split">
  <img src="/media/<topic>/assign-traffic.webp" alt="Assign Traffic dialog with V1 set to 70% and V2 set to 30%, Total Traffic 100% in green, and Cancel and Save buttons" />
</Frame>
```

Captions are burned into the video, so the page uses no `<track>` element. Put a screenshot inside the `<Step>` it illustrates, not in a gallery at the end.

## API endpoint page

Examples: `api-reference/agents/get-assistant-voices.mdx` (OpenAPI-driven) and `api-reference/calling/individual-calls/stop-agent-calls.mdx` (hand-written).

Prefer the OpenAPI form. Parameters and responses then come from `api-reference/openapi.json`, which is exported from the backend and replaced as a whole on each export. Fix schema details at the source and re-export rather than editing the file; keep the page for notes, errors and related links.

````mdx
---
openapi: get /agent/voices
description: "One sentence: what the endpoint returns or does, and the main filter or option."
related:
  - "Voice and language": /documentation/build-agents/customize-agent-behaviour/voice-and-language
---

import { RelatedTopics } from "/snippets/related-topics.mdx";

How to use the result, linking the endpoint it feeds into.

## Notes

- Behaviour a reader can't see in the schema: limits, ordering, what an empty result means.

## Errors

- `401`: `X-API-KEY` is missing or invalid.
- `422`: …

<RelatedTopics items={[["Voice and language", "/documentation/build-agents/customize-agent-behaviour/voice-and-language"]]} />
````

Use the hand-written form (`api: "METHOD /path"` with `<ParamField>`, `<RequestExample>` and `<ResponseExample>`) only when the endpoint isn't in the spec. Keep `related:` and `<RelatedTopics>` listing the same pages. Check every field name, type, required flag and example against the backend or the spec; never infer them.

## Lesson (Resources → Learn)

Example: `resources/learn/building-your-first-agent/test-it.mdx`. Lessons build one running story, Acme Lending's EMI reminder system with the agent Ananya, so a new lesson must continue that story, not start a new one.

````mdx
---
title: "Lesson: Create the agent"
sidebarTitle: "Create the agent"
description: "What the reader builds in this lesson, in one concrete sentence."
---

import { Quiz } from "/snippets/learn-quiz.mdx";

**Part 2: Building your first agent · Lesson 1 of 4 · 10 minutes**

## Objective
One sentence: what works at the end.

## The scenario
Where this lesson sits in the Acme Lending story.

## Hands-on
Video (reuse the topic's video from `media/` when one exists), then `<Steps>`.

## Checkpoint
<Check>What the reader should now see in their workspace.</Check>

## Exercise
A small variation to try, with the expected result.

## What you learned
- Three bullets, each a takeaway rather than a step recap.

<Quiz question="…" answers={[{ text: "…", correct: false }, { text: "…", correct: true }]} correctFeedback="…" incorrectFeedback="…" />

## Reference

<Columns cols={2}>
  <Card title="Test an agent" icon="play" href="/documentation/build-agents/test-and-improve/test-an-agent" horizontal>
    Place a test call, chat with the agent and read the result.
  </Card>
  <Card title="Logs" icon="list-checks" href="/documentation/monitor/logs" horizontal>
    Filter, search and open every call, chat and workflow run.
  </Card>
</Columns>
````

A lesson ends with the quiz and then **Reference** cards to the one or two Documentation pages that cover it in full. Card titles match the target's sidebar title, and the line under each says what the reader will find there. Lessons don't use `RelatedTopics` or `related:` frontmatter; those are for feature families.

Don't end a lesson with a "Next:" line or **Next steps** cards. Mintlify's prev/next buttons follow the sidebar, which is the lesson order, so they already do that job.

Lessons teach; Documentation pages are the reference. Link to the full details instead of copying them into the lesson. When you add a lesson, update the part's lesson count and the table in `resources/learn/all-lessons.mdx`, and add the page to its Learn group in `docs.json`.

## Related topics block (feature families)

Example: every WhatsApp page, such as `documentation/deploy/whatsapp/start-a-conversation.mdx`. List every other page of the family, in reading order (Build → Inventory → Deploy → Monitor), and omit the page itself:

````mdx
---
related:
  - "WhatsApp agents": /documentation/build-agents/agents/whatsapp-agents/overview
  - "Connect WhatsApp": /documentation/inventory/tools-integrations/connect-whatsapp
  - "WhatsApp chats in Logs": /documentation/monitor/logs#whatsapp-chats
---

import { RelatedTopics } from "/snippets/related-topics.mdx";

…page…

## Next steps
…cards…

<RelatedTopics items={[["WhatsApp agents", "/documentation/build-agents/agents/whatsapp-agents/overview"], ["Connect WhatsApp", "/documentation/inventory/tools-integrations/connect-whatsapp"], ["WhatsApp chats in Logs", "/documentation/monitor/logs#whatsapp-chats"]]} />
````

`RelatedTopics` is the last thing on the page, after **Next steps** when there is one. When you add a page to a family, add it to every sibling's list in both places.

## Changelog entry

File: `resources/changelog/changelog.mdx`, newest first.

```mdx
<Update label="29 September 2026" description="API keys" tags={["Account"]}>
  What changed for the user, in one to three sentences or a short list, each linking the page that covers it.
</Update>
```

`label` is the date written out, and `description` is the area. Reuse existing tags (`Account`, `API`, `WhatsApp`, `Widgets`, `Parrot STT`, …) before inventing a new one. Log only changes a reader would act on: new or changed features, endpoints, fields or limits, new pages, moved URLs and corrected facts. Don't log styling, copy edits, typo fixes or media refreshes. Group one day's changes into one entry, and link each change to its page.
