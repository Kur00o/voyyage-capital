import { createFileRoute } from "@tanstack/react-router";
import { AdminPortfolioWorkspace } from "@/components/admin/AdminPortfolioWorkspace";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Voyyage" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return <AdminPortfolioWorkspace />;
}
