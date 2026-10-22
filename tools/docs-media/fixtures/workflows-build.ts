// Stateful stubs for building a workflow from scratch: create → save → publish → test run.
// Each call to buildWorkflowRoutes() starts from an empty workspace-side state.
import { workflowRoutes } from "./workflows.ts";

export const BUILD_ID = "wf_payment_followup_v2";
const RUN_ID = "run_test_5d31c0";

type WireEdge = { source_node_id: string; target_node_id: string; condition_key?: string };
type Wire = { name?: string; entry_node_id?: string; nodes?: { id: string; type: string }[]; edges?: WireEdge[]; variables_config?: unknown };

/** The test run's path: from the entry node along next/Match edges (the borrower promised to pay). */
const pathOf = (g: Wire | null) => {
  const out: string[] = [];
  let cur = g?.entry_node_id;
  while (cur && !out.includes(cur)) {
    out.push(cur);
    cur = (g?.edges ?? []).find((e) => e.source_node_id === cur && (!e.condition_key || e.condition_key === "next" || e.condition_key === "true"))?.target_node_id;
  }
  return out;
};

export function buildWorkflowRoutes() {
  const state = { graph: null as Wire | null, published: false, triggeredAt: 0, name: "Untitled workflow" };
  const ts = new Date().toISOString();
  const versions = () => ({
    workflow_id: BUILD_ID,
    active_version_id: state.published ? "ver_b_1" : null,
    versions: state.graph ? [{ version_id: "ver_b_1", version_slug: "v1", status: state.published ? "published" : "draft", is_active: state.published, created_at: ts, updated_at: ts }] : [],
  });
  const definition = () => ({ id: BUILD_ID, workspace_id: "ws_demo", name: state.name, description: null, status: state.published ? "active" : "draft", entry_node_id: state.graph?.entry_node_id ?? "", nodes: state.graph?.nodes ?? [], edges: state.graph?.edges ?? [], variables_config: state.graph?.variables_config });

  return {
    ...workflowRoutes,
    "POST /workflow": (_u: URL, body: Wire) => {
      state.graph = body;
      state.name = body.name ?? state.name;
      return { id: BUILD_ID, name: state.name, entry_node_id: body.entry_node_id };
    },
    "PUT /workflow/*/graph": (_u: URL, body: Wire) => {
      state.graph = { ...state.graph, ...body };
      return { id: BUILD_ID, entry_node_id: body.entry_node_id, node_count: body.nodes?.length ?? 0, edge_count: body.edges?.length ?? 0 };
    },
    "PATCH /workflow": (_u: URL, body: { name?: string }) => {
      if (body?.name) state.name = body.name;
      return { id: BUILD_ID, name: state.name, status: state.published ? "active" : "draft" };
    },
    "GET /workflow/*/versions": (url: URL) => (url.pathname.includes(BUILD_ID) ? versions() : (workflowRoutes["GET /workflow/*/versions"] as (u: URL) => unknown)(url)),
    "GET /workflow/*": (url: URL) => (url.pathname.endsWith(BUILD_ID) ? definition() : (workflowRoutes["GET /workflow/*"] as (u: URL) => unknown)(url)),
    "POST /workflow/*/publish": () => {
      state.published = true;
      return { status: "active" };
    },
    "POST /workflow/*/trigger": () => {
      state.triggeredAt = Date.now();
      return { run_id: RUN_ID, started: true };
    },
    "GET /workflow/runs/*/trace": (url: URL) => {
      if (!url.pathname.includes(RUN_ID)) return (workflowRoutes["GET /workflow/runs/*/trace"] as (u: URL) => unknown)(url);
      const path = pathOf(state.graph);
      const typeOf = new Map((state.graph?.nodes ?? []).map((n) => [n.id, n.type]));
      const reached = Math.min(path.length, Math.floor((Date.now() - state.triggeredAt) / 1100));
      const done = reached >= path.length;
      const nodes = path.slice(0, reached + 1).map((id, i) => ({ node_id: id, type: typeOf.get(id) ?? "call", status: done || i < reached ? "done" : "running" }));
      return { run_id: RUN_ID, run_status: done ? "completed" : "active", outcome: null, current_node_id: done ? null : path[reached], nodes };
    },
  };
}
