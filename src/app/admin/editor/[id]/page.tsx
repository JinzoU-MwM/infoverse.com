import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { getAdminArticleById, listCategories } from "@/lib/content/queries";
import { ModernArticleEditor } from "@/components/admin/modern-article-editor";
import { ensureArticleDocFromStorage } from "@/lib/editor/content";

export default async function EditArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;

  const [article, categories] = await Promise.all([
    getAdminArticleById(id),
    listCategories(),
  ]);

  if (!article) notFound();

  const doc = ensureArticleDocFromStorage(article.contentJson || null, article.contentHtml);

  return (
    <ModernArticleEditor
      categories={categories}
      values={{
        articleId: article.id,
        title: article.title,
        seoTitle: article.seoTitle || "",
        seoDescription: article.seoDescription || "",
        tagCsv: article.tagCsv,
        categoryId: article.categoryId,
        featuredImagePath: article.featuredImagePath || "",
        contentHtml: article.contentHtml,
        contentJson: JSON.stringify(doc),
      }}
    />
  );
}
