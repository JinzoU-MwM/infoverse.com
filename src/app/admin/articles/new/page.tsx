import { AdminShell } from "@/components/admin/admin-shell";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { requireAdminSession } from "@/lib/auth/session";
import { listCategories } from "@/lib/content/queries";

export default async function AdminNewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; state?: string; saved?: string }>;
}) {
  await requireAdminSession();
  const categories = await listCategories();
  const params = await searchParams;

  return (
    <AdminShell title="Article Editor">
      <ArticleEditorForm
        categories={categories}
        error={params.error}
        saved={params.saved ? params.state : undefined}
        values={{
          title: "",
          seoTitle: "",
          seoDescription: "",
          tagCsv: "",
          categoryId: categories[0]?.id || "",
          featuredImagePath: "",
          contentHtml: "",
        }}
      />
    </AdminShell>
  );
}
