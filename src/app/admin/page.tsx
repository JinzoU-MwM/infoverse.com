import Link from "next/link";
import { WorkflowPipeline } from "@/components/admin/workflow-pipeline";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { QuickStats } from "@/components/admin/quick-stats";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import {
  getArticlesByStatus,
  getRecentActivity,
  getDashboardStats,
  listCategoriesWithArticleCount,
} from "@/lib/content/queries";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  const [draftArticles, reviewArticles, approvedArticles, publishedArticles, activities, stats, categories] = await Promise.all([
    getArticlesByStatus(db, "draft"),
    getArticlesByStatus(db, "review"),
    getArticlesByStatus(db, "approved"),
    getArticlesByStatus(db, "published"),
    getRecentActivity(db, 20),
    getDashboardStats(db),
    listCategoriesWithArticleCount(),
  ]);

  const columns = {
    draft: draftArticles,
    review: reviewArticles,
    approved: approvedArticles,
    published: publishedArticles,
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4">
      <div className="iv-shell space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-poppins)" }}>
              Dashboard
            </h1>
            <p className="text-sm text-slate-500">Welcome back, {session.name}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/editor/new">
              <Button>New Article</Button>
            </Link>
          </div>
        </header>

        {/* Quick Stats */}
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quick Stats
          </h2>
          <QuickStats stats={stats} />
        </section>

        {/* Workflow Pipeline */}
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Workflow Pipeline
          </h2>
          <WorkflowPipeline columns={columns} />
        </section>

        {/* Two Column Layout */}
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          {/* Category Management */}
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  {cat.name} ({cat.articleCount})
                </span>
              ))}
            </div>
          </section>

          {/* Activity Feed */}
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
