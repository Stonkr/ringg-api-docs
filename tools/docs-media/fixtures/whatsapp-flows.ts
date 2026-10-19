// WhatsApp Flows fixtures: the account's Flows tab, a Flow's details, the Flow builder (compile, save, publish,
// duplicate), a Flow's data source and the calendars it can read. Shapes: WAFlow, WAFlowDetail,
// SaveWhatsappFlowResponse, SetFlowDataSourceResponse (types/whatsapp.types.ts) and IntegrationListItem
// (types/integrations.types.ts). compileFlow() mirrors the backend's whatsapp/flows/builder.py, so View as JSON
// and the saved Flow's preview show what Ringg sends to Meta. Fictional data only: made-up Meta ids, .example URLs.
import { NOW } from "./common.ts";
import { WA_ACCOUNT_ID } from "./whatsapp.ts";

type Json = Record<string, any>;

const TEXT_INPUT_TYPES: Record<string, string> = { short_text: "text", email: "email", phone: "phone", number: "number" };
const SIMPLE_COMPONENTS: Record<string, string> = { long_text: "TextArea", date: "DatePicker", consent: "OptIn" };
const CHOICE_COMPONENTS: Record<string, string> = { single_choice: "RadioButtonsGroup", multiple_choice: "CheckboxGroup", dropdown: "Dropdown" };
const TEXT_COMPONENTS: Record<string, string> = { heading: "TextHeading", subheading: "TextSubheading", body: "TextBody", caption: "TextCaption" };

const screenId = (index: number) => {
  let letters = "";
  for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  return `STEP_${letters}`;
};

const uniqueSlugs = (texts: string[], fallback: string) => {
  const used = new Set<string>();
  return texts.map((text, index) => {
    let base = text.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40).replace(/^_+|_+$/g, "");
    if (!/^[a-z]/.test(base)) base = `${fallback}_${index + 1}`;
    let slug = base;
    for (let suffix = 2; used.has(slug); suffix++) slug = `${base}_${suffix}`;
    used.add(slug);
    return slug;
  });
};

const questionComponent = (question: Json, key: string) => {
  const common = { name: key, label: question.label, required: question.required, ...(question.helper_text ? { "helper-text": question.helper_text } : {}) };
  if (TEXT_INPUT_TYPES[question.type]) return { type: "TextInput", ...common, "input-type": TEXT_INPUT_TYPES[question.type] };
  if (SIMPLE_COMPONENTS[question.type]) return { type: SIMPLE_COMPONENTS[question.type], ...common };
  const ids = uniqueSlugs(question.options.map((option: Json) => option.title), "option");
  return { type: CHOICE_COMPONENTS[question.type], ...common, "data-source": question.options.map((option: Json, i: number) => ({ id: ids[i], title: option.title, ...(option.description ? { description: option.description } : {}) })) };
};

const OPTION_ITEM = { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, description: { type: "string" } } };

/** The question's component, reading from the screen's data what the data source fills in (the backend's _live_component). */
const liveComponent = (question: Json, key: string, data: Json) => {
  const component: Json = questionComponent(question, key);
  if (question.options_from_data && CHOICE_COMPONENTS[question.type]) {
    data[`${key}_options`] = { type: "array", items: structuredClone(OPTION_ITEM), __example__: component["data-source"] };
    component["data-source"] = `\${data.${key}_options}`;
  }
  if (question.dates_from_data && question.type === "date") {
    data.min_date = { type: "string", __example__: "2026-10-01" };
    data.max_date = { type: "string", __example__: "2026-10-31" };
    component["min-date"] = "${data.min_date}";
    component["max-date"] = "${data.max_date}";
  }
  return component;
};

/** A builder definition as Flow JSON, as the backend compiles it, live data included. */
export function compileFlow(definition: Json): Json {
  if (definition.kind === "json") return structuredClone(definition.flow_json ?? {});
  const questions = definition.screens.map((screen: Json) => screen.components.filter((item: Json) => item.component === "question"));
  const flat = uniqueSlugs(questions.flat().map((question: Json) => question.label), "question");
  const keys: string[][] = questions.map((list: Json[]) => list.map(() => flat.shift()!));
  let live = false;
  const screens = definition.screens.map((screen: Json, index: number) => {
    const screenKeys = [...keys[index]];
    const data: Json = {};
    const children = screen.components.map((item: Json) => (item.component === "text" ? { type: TEXT_COMPONENTS[item.style], text: item.text } : liveComponent(item, screenKeys.shift()!, data)));
    const isLast = index === definition.screens.length - 1;
    const payload = Object.fromEntries(keys.flatMap((list, at) => list.map((key) => [key, at === index ? `\${form.${key}}` : `\${screen.${screenId(at)}.form.${key}}`])));
    const loadsNext = !isLast && screen.loads_next_screen;
    const action = isLast
      ? { name: "complete", payload }
      : loadsNext
        ? { name: "data_exchange", payload: Object.fromEntries(keys[index].map((key) => [key, `\${form.${key}}`])) }
        : { name: "navigate", next: { type: "screen", name: screenId(index + 1) }, payload: {} };
    children.push({ type: "Footer", label: isLast ? definition.submit_label : screen.button_label || "Continue", "on-click-action": action });
    if (loadsNext || Object.keys(data).length) live = true;
    return { id: screenId(index), title: screen.title, ...(Object.keys(data).length ? { data } : {}), layout: { type: "SingleColumnLayout", children }, ...(isLast ? { terminal: true } : {}) };
  });
  const ids = screens.map((screen: Json) => screen.id);
  return live
    ? { version: "7.0", data_api_version: "3.0", routing_model: Object.fromEntries(ids.map((id: string, index: number) => [id, ids.slice(index + 1, index + 2)])), screens }
    : { version: "7.0", screens };
}

const FIELD_KINDS: Record<string, string> = { TextArea: "long_text", DatePicker: "date", CalendarPicker: "calendar", RadioButtonsGroup: "single_choice", CheckboxGroup: "multiple_choice", Dropdown: "dropdown", ChipsSelector: "chips", OptIn: "opt_in" };
const fromData = (value: unknown) => typeof value === "string" && value.startsWith("${data.");

const componentsOf = (screen: Json): Json[] => {
  const out: Json[] = [];
  const visit = (children: Json[] = []) => children.forEach((child) => (child.type === "Form" ? visit(child.children) : out.push(child)));
  visit(screen.layout?.children);
  return out;
};

/** What the backend's inspector reads from Flow JSON: screens and questions, prefillable data, and the answers it returns. */
export function interfaceOf(flowJson: Json, endpointUri: string | null = null): Json {
  const all = (flowJson.screens ?? []).flatMap(componentsOf);
  const hasEndpoint = !!flowJson.data_api_version;
  const screens = (flowJson.screens ?? []).map((screen: Json) => ({
    id: screen.id,
    title: screen.title ?? null,
    terminal: !!screen.terminal,
    fields: componentsOf(screen)
      .filter((c) => c.type === "TextInput" || FIELD_KINDS[c.type])
      .map((c) => ({ name: c.name, label: fromData(c.label) ? null : c.label, kind: c.type === "TextInput" ? (c["input-type"] ?? "text") : FIELD_KINDS[c.type], required: c.required === true, options_count: Array.isArray(c["data-source"]) ? c["data-source"].length : null })),
  }));
  const entry_inputs = Object.fromEntries(
    (flowJson.screens ?? []).filter((screen: Json) => screen.data).map((screen: Json) => [
      screen.id,
      Object.entries(screen.data as Json).map(([key, spec]) => {
        const field = componentsOf(screen).find((c) => c["init-value"] === `\${data.${key}}`);
        return { key, type: spec.type, field: field?.name ?? null, field_label: field?.label ?? null };
      }),
    ]),
  );
  const complete = (flowJson.screens ?? []).flatMap(componentsOf).find((c: Json) => c.type === "Footer" && c["on-click-action"]?.name === "complete");
  const outputs = Object.entries((complete?.["on-click-action"].payload ?? {}) as Json).map(([key, value]) => {
    const name = String(value).match(/form\.(\w+)\}$/)?.[1];
    const source = all.find((c: Json) => c.name === name);
    return { key, label: typeof source?.label === "string" && !fromData(source.label) ? source.label : key, component: source?.type ?? null, options: Object.fromEntries((Array.isArray(source?.["data-source"]) ? source["data-source"] : []).map((o: Json) => [o.id, o.title])) };
  });
  return { has_endpoint: hasEndpoint, screens, entry_inputs, outputs, endpoint_uri: endpointUri };
}

const question = (type: string, label: string, extra: Json = {}) => ({ component: "question", type, label, required: true, helper_text: null, options: [], ...extra });
const options = (...titles: string[]) => titles.map((title) => ({ title, description: null }));

/** The two-screen form the builder video creates, saved as a published Ringg Flow in the others. */
export const siteVisitDefinition = {
  kind: "form",
  submit_label: "Request visit",
  screens: [
    { title: "Your details", button_label: "Continue", components: [question("short_text", "Full name", { helper_text: "As on your ID" }), question("phone", "Phone")] },
    { title: "Visit details", button_label: null, components: [question("dropdown", "Project", { options: options("Green Acres Villas", "Lakeview Residences", "Palm Grove Plots") }), question("date", "Preferred visit date"), question("single_choice", "Visitors", { options: options("1", "2", "3 or more") })] },
  ],
};

// Flows made in WhatsApp Manager. The two with live data are drafts until their data source is set.
const bookVisitJson = {
  version: "6.3", data_api_version: "3.0", routing_model: { PICK_DATE: ["PICK_SLOT"], PICK_SLOT: [] },
  screens: [
    { id: "PICK_DATE", title: "Pick a date", data: { min_date: { type: "string", __example__: "2026-10-01" }, max_date: { type: "string", __example__: "2026-10-31" } },
      layout: { type: "SingleColumnLayout", children: [
        { type: "DatePicker", name: "date", label: "Date", required: true, "min-date": "${data.min_date}", "max-date": "${data.max_date}" },
        { type: "Footer", label: "See times", "on-click-action": { name: "data_exchange", payload: { date: "${form.date}" } } },
      ] } },
    { id: "PICK_SLOT", title: "Pick a time", terminal: true,
      data: { date: { type: "string", __example__: "2026-10-02" }, slots: { type: "array", items: { type: "object", properties: { id: { type: "string" }, title: { type: "string" } } }, __example__: [{ id: "2026-10-02T10:00:00+05:30", title: "10:00 AM" }] } },
      layout: { type: "SingleColumnLayout", children: [
        { type: "RadioButtonsGroup", name: "slot", label: "Available times", "data-source": "${data.slots}", required: true },
        { type: "TextInput", name: "name", label: "Your name", required: true },
        { type: "TextInput", name: "email", label: "Email", "input-type": "email", required: true },
        { type: "Footer", label: "Book", "on-click-action": { name: "complete", payload: { date: "${data.date}", slot: "${form.slot}", name: "${form.name}", email: "${form.email}" } } },
      ] } },
  ],
};

const findShowroomJson = {
  version: "6.3", data_api_version: "3.0", routing_model: { PINCODE: ["PICK_SHOWROOM"], PICK_SHOWROOM: [] },
  screens: [
    { id: "PINCODE", title: "Find a showroom", layout: { type: "SingleColumnLayout", children: [
      { type: "TextInput", name: "pincode", label: "Your pincode", "input-type": "number", required: true },
      { type: "Footer", label: "Find showrooms", "on-click-action": { name: "data_exchange", payload: { pincode: "${form.pincode}" } } },
    ] } },
    { id: "PICK_SHOWROOM", title: "Pick a showroom", terminal: true,
      data: { pincode: { type: "string", __example__: "560001" }, showrooms: { type: "array", items: { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, description: { type: "string" } } }, __example__: [{ id: "blr-mg-road", title: "MG Road", description: "2.1 km away" }] } },
      layout: { type: "SingleColumnLayout", children: [
        { type: "RadioButtonsGroup", name: "showroom", label: "Showrooms near you", "data-source": "${data.showrooms}", required: true },
        { type: "Footer", label: "Choose", "on-click-action": { name: "complete", payload: { pincode: "${data.pincode}", showroom: "${form.showroom}" } } },
      ] } },
  ],
};

const feedbackJson = {
  version: "7.0",
  screens: [{ id: "FEEDBACK", title: "Rate your visit", terminal: true, layout: { type: "SingleColumnLayout", children: [
    { type: "RadioButtonsGroup", name: "rating", label: "How was your visit?", required: true, "data-source": [{ id: "great", title: "Great" }, { id: "okay", title: "Okay" }, { id: "poor", title: "Poor" }] },
    { type: "TextArea", name: "comments", label: "Anything to add?", required: false },
    { type: "Footer", label: "Send", "on-click-action": { name: "complete", payload: { rating: "${form.rating}", comments: "${form.comments}" } } },
  ] } }],
};

const ENDPOINT = (id: string) => `https://flows.ringg.example/whatsapp/flows/${id}/exchange`;
// Made-up Meta Flow ids: four seeded Flows, then one per Flow created or duplicated in a scenario.
const META_FLOW_IDS = ["1268403917552064", "1093517628840271", "2014736659021873", "1187290453316658"];
const metaFlowId = (n: number) => META_FLOW_IDS[n - 1] ?? `13520488${String(17663900 + n * 4127).slice(-8)}`;

type FlowRow = Json & { flow_json: Json };
const makeFlow = (id: string, n: number, name: string, status: string, categories: string[], flow_json: Json, builder_definition: Json | null = null): FlowRow => ({
  id, telephony_account_id: WA_ACCOUNT_ID, meta_flow_id: metaFlowId(n), name, status, categories, json_version: flow_json.version, has_endpoint: !!flow_json.data_api_version,
  interface: interfaceOf(flow_json), synced_at: NOW, data_source: null, builder_definition, flow_json,
});

export const FLOW_IDS = { siteVisit: "waf_site_visit", bookVisit: "waf_book_visit", findShowroom: "waf_find_showroom", feedback: "waf_visit_feedback" };

const seedFlows = () => [
  makeFlow(FLOW_IDS.siteVisit, 1, "Site visit request", "PUBLISHED", ["LEAD_GENERATION"], compileFlow(siteVisitDefinition), siteVisitDefinition),
  makeFlow(FLOW_IDS.bookVisit, 2, "Book a visit", "DRAFT", ["APPOINTMENT_BOOKING"], bookVisitJson),
  makeFlow(FLOW_IDS.findShowroom, 3, "Find a showroom", "DRAFT", ["OTHER"], findShowroomJson),
  makeFlow(FLOW_IDS.feedback, 4, "Visit feedback", "PUBLISHED", ["SURVEY"], feedbackJson),
];

/** GET /integrations: connected calendars a Flow's data source can read. */
export const connectedCalendars = [
  { integration_id: "int_gcal_acme", provider_id: "google_calendar", integration_name: "Site visits", category: "scheduling", status: "active", status_message: "", tool_count: 3 },
  { integration_id: "int_calendly_acme", provider_id: "calendly", integration_name: "Acme sales team", category: "scheduling", status: "active", status_message: "", tool_count: 2 },
];

const SIGNING_SECRET = "rfs_docs_8Kq2xV7mNw4pLz9tRb6yHc3dFj5sGa1e";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fresh, stateful Flow routes for one scenario. `without` leaves seeded Flows out, so the builder video can create
 * "Site visit request" itself. Lists never carry flow_json; details add it with the preview link.
 */
export function makeWhatsappFlowRoutes({ without = [] as string[] } = {}) {
  const flows = seedFlows().filter((flow) => !without.includes(flow.id));
  let seq = 10;
  const byId = (url: URL) => flows.find((flow) => flow.id === url.pathname.split("/whatsapp/flows/")[1].split("/")[0]);
  const row = ({ flow_json, ...flow }: FlowRow) => flow;
  const detail = (flow: FlowRow) => ({ ...flow, preview_url: `https://business.facebook.example/wa/manage/flows/${flow.meta_flow_id}/preview`, ringg_endpoint_uri: flow.data_source ? ENDPOINT(flow.id) : null });
  const save = (flow: FlowRow, b: Json) => {
    flow.name = b.name;
    flow.categories = b.categories;
    flow.builder_definition = b.definition;
    flow.flow_json = compileFlow(b.definition);
    flow.json_version = flow.flow_json.version;
    flow.has_endpoint = !!flow.flow_json.data_api_version;
    flow.interface = interfaceOf(flow.flow_json);
    flow.synced_at = NOW;
    return { flow: row(flow), validation_errors: [] };
  };
  const listed = () => ({ flows: flows.map(row) });

  return {
    "GET /integrations": connectedCalendars,
    "GET /whatsapp/flows": listed,
    "POST /whatsapp/flows/sync": async () => {
      await wait(900);
      return listed();
    },
    "POST /whatsapp/flows/compile": (_u: URL, b: Json) => {
      const flow_json = compileFlow(b.definition);
      return { flow_json, interface: interfaceOf(flow_json) };
    },
    "POST /whatsapp/flows": async (_u: URL, b: Json) => {
      await wait(900);
      const flow = makeFlow(`waf_new_${++seq}`, seq, b.name, "DRAFT", b.categories, compileFlow(b.definition), b.definition);
      flows.unshift(flow);
      return save(flow, b);
    },
    "GET /whatsapp/flows/*": (url: URL) => detail(byId(url)!),
    "PUT /whatsapp/flows/*": async (url: URL, b: Json) => {
      await wait(1200);
      return save(byId(url)!, b);
    },
    "POST /whatsapp/flows/*/publish": async (url: URL) => {
      await wait(800);
      const flow = byId(url)!;
      flow.status = "PUBLISHED";
      return row(flow);
    },
    "POST /whatsapp/flows/*/duplicate": async (url: URL) => {
      await wait(700);
      const source = byId(url)!;
      const definition = source.builder_definition ?? { kind: "json", screens: [], submit_label: "Submit", flow_json: source.flow_json };
      const copy = makeFlow(`waf_new_${++seq}`, seq, `${source.name} (copy)`, "DRAFT", source.categories, compileFlow(definition), definition);
      flows.unshift(copy);
      return { flow: row(copy), validation_errors: [] };
    },
    "PUT /whatsapp/flows/*/data-source": async (url: URL, b: Json) => {
      await wait(1300);
      const flow = byId(url)!;
      const input = b.data_source;
      const issueSecret = input.type === "http" && (flow.data_source?.type !== "http" || input.rotate_secret);
      flow.data_source = input.type === "http" ? { type: "http", url: input.url, has_signing_secret: true } : input;
      flow.interface = interfaceOf(flow.flow_json, ENDPOINT(flow.id));
      return { flow: row(flow), endpoint_uri: ENDPOINT(flow.id), endpoint_on_meta: true, meta_error: null, signing_secret: issueSecret ? SIGNING_SECRET : null };
    },
    "DELETE /whatsapp/flows/*/data-source": (url: URL) => {
      const flow = byId(url)!;
      flow.data_source = null;
      return row(flow);
    },
  } as Record<string, unknown>;
}
