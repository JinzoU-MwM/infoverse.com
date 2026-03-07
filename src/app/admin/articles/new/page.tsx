import { AdminShell } from "@/components/admin/admin-shell";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { requireAdminSession } from "@/lib/auth/session";
import { listCategories } from "@/lib/content/queries";
import { EMPTY_ARTICLE_DOC } from "@/lib/editor/content";

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
          contentHtml: "<p></p>",
          contentJson: JSON.stringify(EMPTY_ARTICLE_DOC),
          suggestionStateJson: "[]",
        }}
      />
    </AdminShell>
  );
}
