import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  createCategoryAction,
  deleteArticleAction,
  deleteCategoryAction,
  publishArticleAction,
  updateCategoryAction,
} from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/auth/session";
import { adminMetrics, listAdminArticles, listCategoriesWithArticleCount } from "@/lib/content/queries";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";

function toneClass(tone: "default" | "warn" | "critical" | "success") {
  if (tone === "warn") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "critical") return "border-red-200 bg-red-50 text-red-900";
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  return "border-slate-200 bg-white text-slate-900";
}

function categoryAlert(status: string | undefined) {
  if (!status) return null;
  if (status === "created") return <Alert tone="success">Category created.</Alert>;
  if (status === "updated") return <Alert tone="success">Category updated.</Alert>;
  if (status === "deleted") return <Alert tone="success">Category deleted.</Alert>;
  if (status === "in-use") return <Alert tone="warn">Category cannot be deleted while articles still reference it.</Alert>;
  if (status === "exists") return <Alert tone="warn">Category slug already exists.</Alert>;
  if (status === "missing") return <Alert tone="error">Category not found.</Alert>;
  return <Alert tone="error">Category action failed.</Alert>;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string; deleted?: string; alert?: string; category?: string }>;
}) {
  const session = await requireAdminSession();
  const metrics = await adminMetrics();
  const rows = await listAdminArticles();
  const categoryRows = await listCategoriesWithArticleCount();
  const params = await searchParams;
  const critical = metrics.some((m) => m.tone === "critical") || params.alert === "critical";

  return (
    <AdminShell title="Admin Dashboard">
      {params.published ? <Alert tone="success">Publish complete.</Alert> : null}
      {params.deleted ? <Alert tone="warn">Article deleted.</Alert> : null}
      {categoryAlert(params.category)}

      {critical ? (
        <Alert tone="error">
          Critical threshold crossed: denied actions and failure rate exceed safe baseline.
        </Alert>
      ) : null}

      <section className="grid gap-3 md:grid-cols-4">
        {metrics.map((m) => (
          <article key={m.label} className={`rounded-xl border p-3 ${toneClass(m.tone)}`}>
            <p className="text-xs">{m.label}</p>
            <p style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-bold">
              {m.value}
            </p>
          </article>
        ))}
      </section>

      <section className="iv-card overflow-x-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-xl font-semibold">
            Recent Articles
          </h2>
          <Link href="/admin/articles/new" className="inline-flex">
            <Button>New Article</Button>
          </Link>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Author</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <Td>{row.title}</Td>
                <Td>{row.categoryName}</Td>
                <Td>{row.authorName}</Td>
                <Td>
                  <Badge tone={row.status === "published" ? "success" : "warn"}>{row.status}</Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/articles/${row.id}`} className="inline-flex">
                      <Button variant="outline" className="px-3 py-1 text-xs">
                        Edit
                      </Button>
                    </Link>
                    {row.status === "draft" ? (
                      <form action={publishArticleAction}>
                        <input type="hidden" name="articleId" value={row.id} />
                        <Button type="submit" className="px-3 py-1 text-xs">
                          Publish
                        </Button>
                      </form>
                    ) : null}
                    <form action={deleteArticleAction}>
                      <input type="hidden" name="articleId" value={row.id} />
                      <Button variant="outline" type="submit" className="px-3 py-1 text-xs">
                        Delete
                      </Button>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      <section className="iv-card space-y-3 p-4">
        <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-xl font-semibold">
          Category Management
        </h2>

        <form className="flex gap-2" action={createCategoryAction}>
          <Input name="name" placeholder="New category name" required />
          <Button type="submit">Create</Button>
        </form>

        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Slug</Th>
                <Th>Articles</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {categoryRows.map((category) => (
                <tr key={category.id} className="border-t border-slate-100">
                  <Td>
                    <form action={updateCategoryAction} className="flex gap-2">
                      <input type="hidden" name="categoryId" value={category.id} />
                      <Input name="name" defaultValue={category.name} required />
                      <Button type="submit" variant="outline">
                        Save
                      </Button>
                    </form>
                  </Td>
                  <Td>{category.slug}</Td>
                  <Td>{category.articleCount}</Td>
                  <Td>
                    {session.role === "owner" ? (
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <Button type="submit" variant="destructive" className="px-3 py-1 text-xs" disabled={category.articleCount > 0}>
                          Delete
                        </Button>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-500">Owner only</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>
    </AdminShell>
  );
}
