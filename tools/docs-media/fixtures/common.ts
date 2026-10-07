// Shared demo data for every scenario. Fictional: no real customer, number or key.
export const NOW = "2026-10-01T10:30:00Z";

export const workspace = {
  id: "ws_demo",
  name: "Acme Lending",
  api_key: "",
  total_available_credits: 12500,
  account_type: "company",
  currency: "INR",
  entity_type: "company",
  updated_at: NOW,
  created_at: "2026-06-01T09:00:00Z",
  archived_at: "",
  is_archived: false,
  bulk_api_key: "",
  free_generations: 0,
  subscription_type: "prepaid",
  workspace_config: { custom_voices: [] },
  credits: 12500,
  new_billing_enabled: true,
  is_onboarded: true,
  is_kyc_done: true,
  is_enterprise: false,
  is_international_calls_enabled: false,
  parent_workspace_id: null,
};

export const user = {
  id: "usr_demo",
  name: "Priya Sharma",
  email: "priya@acme-lending.example",
  avatar: null,
  created_at: "2026-06-01T09:00:00Z",
  user_workspace_id: "ws_demo",
};

const meWorkspace = { id: workspace.id, name: workspace.name, role: "owner", credits: workspace.credits, created_at: workspace.created_at };

/** Routes every page needs to boot the dashboard shell. Keys: "METHOD /path" (path after /api/backend/). */
export const shellRoutes: Record<string, unknown> = {
  "GET /auth/me": {
    message: "ok",
    session_expires_at: Math.floor(Date.now() / 1000) + 86_400,
    user,
    user_workspaces: [meWorkspace],
    current_workspace: meWorkspace,
    is_new_user: false,
  },
  "GET /workspace/all": { workspaces: [workspace] },
  "GET /workspace": { workspace_info: workspace },
};
