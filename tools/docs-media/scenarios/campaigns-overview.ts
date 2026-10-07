import type { Scenario } from "../run.ts";
import { campaignRoutes } from "../fixtures/campaigns.ts";

// Screenshot only: the list in motion is covered by campaigns-manage.
export default {
  name: "campaigns-overview",
  title: "Campaigns",
  docsPage: "campaigns/overview",
  routes: { ...campaignRoutes },
  async run(s) {
    await s.page.context().addCookies([{ name: "sidebar:state", value: "false", url: "http://localhost:3201" }]);
    await s.goto("/campaigns");
    await s.pause(800);
    await s.shot("campaigns-list");
  },
} satisfies Scenario;
