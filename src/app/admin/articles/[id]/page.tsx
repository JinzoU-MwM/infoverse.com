import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { requireAdminSession } from "@/lib/auth/session";
import { getAdminArticleById, listCategories } from "@/lib/content/queries";

export default async function AdminEditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; state?: string }>;
}) {
  await requireAdminSession();

  const { id } = await params;
  const [article, categories, qp] = await Promise.all([
    getAdminArticleById(id),
    listCategories(),
    searchParams,
  ]);

  if (!article) notFound();

  return (
    <AdminShell title={`Edit Article: ${article.title}`}>
      <ArticleEditorForm
        categories={categories}
        error={qp.error}
        saved={qp.saved ? qp.state : undefined}
        values={{
          articleId: article.id,
          title: article.title,
          seoTitle: article.seoTitle || "",
          seoDescription: article.seoDescription || "",
          tagCsv: article.tagCsv,
          categoryId: article.categoryId,
          featuredImagePath: article.featuredImagePath || "",
          contentHtml: article.contentHtml,
        }}
      />
    </AdminShell>
  );
}
