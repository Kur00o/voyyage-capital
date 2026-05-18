import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkSubscriberAccess } from "@/lib/analytics-terminal/analytics-fns";
import { AnalyticsWorkspace } from "@/components/analytics/AnalyticsWorkspace";

export const Route = createFileRoute("/analytics")({
  beforeLoad: async () => {
    const access = await checkSubscriberAccess();
    if (!access.ok) throw redirect({ href: "/#plans" });
  },
  head: () => ({
    meta: [
      { title: "Terminal — Voyyage" },
      { name: "description", content: "Live NSE market terminal and model portfolios for Voyyage subscribers." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return <AnalyticsWorkspace />;
}
