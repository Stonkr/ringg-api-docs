import { readFileSync } from "node:fs";
// Knowledge base (v2) fixtures for "Acme Lending". Shapes follow app-main lib/api/kb-v2.api.ts and types/kb-v2.types.ts.
// kbRoutes is stateful: POST /kb/v2 creates "loan_faqs", which reads as processing for a few seconds, then ready.
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const NEW_KB_ID = "kb_loan_faqs";
const TRAIN_MS = 7000;

const existing = [
  { kb_id: "kb_branch_locations", kb_name: "branch_locations", status: "ready", file_count: 1, last_trained_at: ago(60 * 5), created_at: ago(60 * 24 * 20) },
  { kb_id: "kb_loan_policies", kb_name: "loan_policies", status: "ready", file_count: 3, last_trained_at: ago(60 * 26), created_at: ago(60 * 24 * 40) },
];

const col = (fileId: string, name: string, position: number, type = "string", exact = false) => ({ id: `col_${name}`, kb_file_id: fileId, name, type, exact_match: exact, similarity_search: true, description: "", position });

const faqAnswer = {
  answer: "You need a CIBIL score of 700 or above for a personal loan [1]. Applicants between 650 and 699 may still qualify with a co-applicant [1].",
  sources: [
    { label: "acme-lending-faq.csv · row 1", snippet: "What is the minimum credit score for a personal loan? A CIBIL score of 700 or above. Applicants between 650 and 699 may qualify with a co-applicant.", kind: "tabular", score: 0.92, file_id: "kbf_faq_csv", row_id: "row_1", data: { question: "What is the minimum credit score for a personal loan?", answer: "A CIBIL score of 700 or above. Applicants between 650 and 699 may qualify with a co-applicant.", category: "Eligibility", updated_on: "2026-09-15" } },
  ],
};

// Rows of fixtures/acme-lending-faq.csv, as GET .../rows returns them.
const faqRows = readFileSync(new URL("./acme-lending-faq.csv", import.meta.url), "utf8").trim().split("\n").slice(1).map((line, i) => {
  const cells = line.match(/("([^"]*)"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, ""));
  return { id: `row_${i + 1}`, data: { question: cells[0], answer: cells[1], category: cells[2], updated_on: cells[3] } };
});

export function buildKbRoutes() {
  const state = { createdAt: 0, name: "loan_faqs", urls: [] as string[] };
  const ready = () => state.createdAt > 0 && Date.now() - state.createdAt > TRAIN_MS;
  const detail = () => {
    const done = ready();
    return {
      kb_id: NEW_KB_ID, kb_name: state.name, status: done ? "ready" : "processing", created_at: new Date(state.createdAt).toISOString(), updated_at: new Date().toISOString(),
      files: [
        { file_id: "kbf_faq_csv", file_type: "file", filename: "acme-lending-faq.csv", file_size: 2, processing_status: done ? "indexed" : "processing", processing_error: null, file_path: null, columns: ["question", "answer", "category"].map((n, i) => col("kbf_faq_csv", n, i)).concat([col("kbf_faq_csv", "updated_on", 3, "date")]) },
        ...state.urls.map((u, i) => ({ file_id: `kbf_url_${i}`, file_type: "url", filename: u, file_size: null, processing_status: done ? "indexed" : "pending", processing_error: null, file_path: u, columns: [], content: done ? "# Personal loan FAQs\n\nAnswers to common questions about Acme Lending personal loans." : null })),
      ],
    };
  };
  const list = () => [
    ...(state.createdAt ? [{ kb_id: NEW_KB_ID, kb_name: state.name, status: ready() ? "ready" : "processing", file_count: 1 + state.urls.length, last_trained_at: ready() ? new Date().toISOString() : null, created_at: new Date(state.createdAt).toISOString() }] : []),
    ...existing,
  ];

  return {
    "GET /workspace/features": {},
    "GET /kb/v2/all": () => list(),
    "POST /kb/v2": () => {
      state.createdAt = Date.now();
      state.urls = ["https://www.acme-lending.example/personal-loans/faq"];
      return { message: "Knowledge base creation started", kb_id: NEW_KB_ID, processing_status: "pending", file_count: 2 };
    },
    "GET /kb/v2/*": (url: URL) => (url.pathname.endsWith(NEW_KB_ID) ? detail() : { kb_id: url.pathname.split("/").at(-1), kb_name: "loan_policies", status: "ready", created_at: ago(60 * 24 * 40), updated_at: ago(60 * 26), files: [] }),
    "GET /kb/v2/*/retrieval-config": (url: URL) => ({ message: "ok", kb_id: url.pathname.split("/")[3], retrieval_config: { alpha: 0.5, top_k: 5, score_threshold: 0.3 } }),
    "POST /kb/v2/*/test-query": (_u: URL, body: { question?: string }) => ({ kb_id: NEW_KB_ID, question: body?.question ?? "", ...faqAnswer }),
    "POST /kb/v2/url/preview": (_u: URL, body: { url?: string }) => ({ url: body?.url ?? "", content: "# Personal loan FAQs\n\n**Who can apply?** Salaried and self-employed Indian residents aged 21 to 60.\n\n**How much can I borrow?** From ₹50,000 up to ₹25 lakh, depending on income and credit score.\n\n**How fast is disbursal?** Usually within 24 hours of approval." }),
    "GET /kb/v2/*/files/*/rows": (url: URL) => {
      const q = (url.searchParams.get("search") ?? "").toLowerCase();
      const rows = q ? faqRows.filter((r) => Object.values(r.data).some((v) => v.toLowerCase().includes(q))) : faqRows;
      return { total: rows.length, limit: 25, offset: 0, rows };
    },
    // Crawl: pages found under the site address (Fetch Links).
    "GET /kb/v2/pages": () => ["personal-loans/faq", "personal-loans/eligibility", "home-loans/faq", "home-loans/documents", "repayments/emi-calculator", "contact/branches"].map((path) => `https://www.acme-lending.example/${path}`),
  };
}

export const kbRoutes = buildKbRoutes();
