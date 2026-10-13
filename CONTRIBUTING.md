# Contributing to the Ringg docs

Read this before any change, by hand or with an AI agent. docs.ringg.ai is built with Mintlify: every page is an `.mdx` file, and `docs.json` decides where it shows up.

Preview locally with `pnpm install` and `pnpm dev` (http://localhost:3000). `tools/`, `contributing/` and this file are in `.mintignore`, so they are never published.

## Rule one: the docs read as one path

Readers follow one flow: build an agent → give it inventory → deploy it → monitor it. The sidebar, page order, cards, related topics, API groups and lessons all follow it, with the same names and the same fictional data. A correct page that is out of step with its neighbours still breaks the docs. Treat every change as a change to the whole path.

## Keep it in sync

| When you change… | Also update… |
|---|---|
| A feature or screen | Its guide, API page(s), lesson, media and changelog |
| A page title or feature name | `docs.json` label, link texts, card titles, related topics, lesson references, video title cards |
| A page location | `docs.json`, a redirect, inbound links (this repo and the frontend repos), the scenario's `docsPage` |
| A new page | Its place in `docs.json`, **Before you start** / **Next steps** cards on neighbouring pages, its family's related topics, the matching API group or lesson |
| A telephony provider | Provider tables in `phone-numbers/overview.mdx`, `buy-or-import-a-number.mdx` and `your-own-telephony/byot-overview.mdx`, plus **Provider-side routing** in `inbound-agent-number.mdx`. Model the guide on the Plivo page |
| An endpoint | The spec at its source (see **Facts**), its API page, the guide that shows the call |
| Anything a reader would act on | `resources/changelog/changelog.mdx`, one `<Update>` per day: new or changed features, endpoints, fields, limits, new pages, moved URLs, corrected facts. Not styling, copy edits, typos or media refreshes |

Unsure whether something else is affected? Ask before shipping.

## Facts

- **Verify everything.** UI labels, defaults, limits and errors come from the dashboard frontend repo; endpoints and fields from `api-reference/openapi.json` and the backend. Can't confirm it? Ask or leave it out. Never guess.
- **Raise gaps.** If the docs miss something or look outdated and the source doesn't settle it, ask.
- **Quote the UI exactly:** buttons and fields in bold (`**Create Versions**`), on-screen messages in quotes.
- **Nothing private:** no internal URLs, admin endpoints, environment names, repo names, customer names, real numbers, keys or employee emails. `DELETE /agent/{agent_id}` and `PATCH /public/agent/{agent_id}` are public but undocumented; mention them only in notes. Unsure if something is live? Ask.
- **`api-reference/openapi.json` is public.** It is served at `/api-reference/openapi.json` and feeds the playground and the AI assistant, so an endpoint is exposed the moment it is in the spec, page or no page. Keep only endpoints customers may call, with the production server and fictional examples. No admin, internal or staging paths. Every endpoint in the spec gets a page unless it is deliberately undocumented, and then it is listed in the bullet above.
- **Don't hand-edit `openapi.json`.** It is exported from the backend and replaced as a whole on the next export, so anything typed into the file directly (a clearer description, a fixed example, a corrected type) is lost then. Make those fixes in the backend source and re-export. Anything that belongs to the docs rather than the API (notes, errors, related links) goes in the endpoint's `.mdx` page, which survives an export. If a fix can't wait for an export, apply it in both places and say so in the PR.
- **Shared fictional data only:** Acme Lending, Priya Sharma (`priya@acme-lending.example`), numbers like `+919876543210`, IDs like `00000000-0000-4000-8000-000000000110`. The Security page promises readers that nothing in the docs is real; keep it true.

## Where a page goes

**Documentation:** Build agents (basics, then advanced) → Inventory → Deploy → Monitor → Manage account → Ringg Labs. Simpler pages first within each group.

| Area | Holds |
|---|---|
| Get started | Introduction, how Ringg works, dashboard tour |
| Build agents | Agent types, prompt, voice, variables, knowledge base, tools, call settings, webhooks, testing, versions, workflows |
| Inventory | Knowledge bases, tools (integrations, including Connect WhatsApp), phone numbers |
| Deploy | Campaigns, web widget and mobile apps, WhatsApp |
| Monitor | Logs, analytics, evals, alerts |
| Manage account | Members, API key, billing, call limits, Ringg Spaces |
| Ringg Labs | Experimental products (Parrot STT) |
| Resources | MCP server, lessons, security, changelog |

**API reference:** Introduction → Agents → Inventory → Calling → Monitoring → Account. Group by what the reader is doing, not by URL prefix (stop-call endpoints sit beside the ones that start calls). Put a new endpoint next to its closest sibling. Slugs name what the page does.

**Folder = sidebar = URL.** A file's path is its published URL, so folders mirror the nav exactly: the page under **Documentation → Build agents → Customize agent behaviour** is `documentation/build-agents/customize-agent-behaviour/<slug>.mdx` and lives at that same path on docs.ringg.ai; an endpoint under **Calling → Individual calls** is `api-reference/calling/individual-calls/<slug>.mdx`. Slugs are kebab-case. Moving or renaming a file changes a live link, so it always comes with a redirect (see below).

- **Build, Deploy and Monitor never share a page.** Link across instead.
- **One topic, one home.** Explain once, link everywhere else.
- **Split big pages, but only add a subfolder when the parts are siblings.** A page past ~1,800 words with distinct sections gets split. Use a subfolder (its own sidebar group) when the parts are parallel items of one kind: tools split into integrations (WhatsApp, Google Sheets, …), or later into pre-call, on-call, post-call and webhooks. Otherwise keep the new pages in the current group and order them the way a reader uses them. Redirect the old URL to the new main page.
- **Names** are short sentence-case nouns ("Agent prompt", not "Write the agent's prompt").
- **One topic in several places gets Related topics.** When pages about the same topic sit in different groups or tabs, as WhatsApp does (set up in Inventory, built in Build agents, sent in Deploy, read in Monitor), each page stays where the flow puts it and ends with the same **Related topics** list linking all the others. Add a new page to every sibling's list.
- **New features stand out while they are new.** Give the feature's group or main page `"tag": "NEW"` in `docs.json` (`"BETA"` for beta features) and `boost: 4` in its frontmatter so search ranks it higher. Remove both once the feature is no longer new, unless the page is a key page anyway. **No page icons** in the sidebar.

### Move or rename a page

1. `pnpm exec mint rename <from> <to>` updates internal links. Then add a redirect in `docs.json` (`:slug*` wildcards work for whole folders). Never break a published URL.
2. Grep for the old path here and in the frontend repos, and update any `docsPage` in `tools/docs-media/scenarios/`.

## Writing

- Open with what it is and when to use it (two sentences max), then the dashboard path: `In the dashboard: **Sidebar → Assistants →** open an agent.`
- Cover defaults, limits, errors and where the result shows. Skip the obvious.
- Say each thing once; link back instead of repeating. Link a concept on first mention only.
- Active voice, "you", no marketing words, no em dashes, no filler ("Note that").
- Headings are short and sentence case, `##` and `###` only; the title comes from frontmatter.
- Terms: agents (sidebar says Assistants), Ringg Spaces, single-prompt / multi-prompt agents, workflows, lessons (not course), section (not chapter), Ringg AI (never DesiVocal). Section page lists must match `docs.json`.
- Frontmatter: sentence-case `title`; specific 140-160 character `description`; `"og:title"` on Documentation pages; `boost` only on key pages and new features (`4`) and entry points (`8`).

## Page templates and components

Copy the skeletons in [`contributing/page-templates.md`](contributing/page-templates.md): guide, API endpoint, lesson, changelog entry. A page that skips the skeleton (no **Before you start**, Title Case headings, a block of external support links at the end) reads as foreign next to its neighbours.

Pages should be easy to scan and look polished. Let Mintlify's built-in components carry the structure: pick the one that matches the content's shape instead of writing long paragraphs, and don't stack so many that the page looks busy. Check Mintlify's component list before building a custom one.

| Content | Use |
|---|---|
| Prerequisites | `## Before you start` + `<Columns cols={2}>` of horizontal `<Card>` |
| Next pages (guides, not lessons) | `## Next steps` + `<Columns cols={3}>` of `<Card>` to Ringg pages, not external links |
| Procedure | `<Steps>`, ending with `<Check>` |
| Comparisons | Table |
| Fields, parameters, payloads | `<ResponseField>` / `<ParamField>`, with `<Expandable>` for nested objects |
| Request and response next to the text | `<RequestExample>` / `<ResponseExample>` |
| Short status labels (New, Beta, plan) | `<Badge>` |
| Folder or file structure | `<Tree>` |
| Flows | `mermaid`, under ~8 nodes |
| Unfamiliar term | `<Tooltip>`, first use only |
| Optional depth | `<AccordionGroup>` |
| Code in several languages | `<CodeGroup>`: cURL, JavaScript, Python |
| Real risk | `<Warning>` (rare) |
| Media | `<Frame caption="…">` |
| Card grids | `<Columns>`, never the deprecated `<CardGroup>` |
| Related pages | `related:` frontmatter + `RelatedTopics` snippet last, same list |

Reusable blocks live in `snippets/` (`related-topics`, `learn-quiz`, `figure-card`, the widget snippets); import them at the top of the page. A bare `{`, `}` or `<` in prose breaks the build; use backticks.

## Media

- Key, complex topics get a video showing the feature fully in use; simple ones don't.
- Each video folder `media/<topic>/` holds `video.webm`, `poster.webp` (white title card, also the first frame), `captions.vtt` and `.webp` screenshots. No PNG, JPG, MP4 or GIF.
- Generate media with `tools/docs-media`, never by hand. Read [`contributing/media-pipeline.md`](contributing/media-pipeline.md) first.
- Embed with the video block in the templates (no autoplay, poster, `alt` and `aria-label`). Every image gets specific `alt` text.

## Before you commit

1. `pnpm dev`: open every touched page in light and dark mode.
2. `npx mint@latest validate`, `npx mint@latest broken-links` and `npx mint@latest a11y` (the pinned CLI lacks `validate`).
3. Walk the reader's route through what you touched and check **Keep it in sync**.
4. Only `media/<topic>/` output goes in git.
