import { requireAdminSession } from "@/lib/auth/session";
import { listCategories } from "@/lib/content/queries";
import { ModernArticleEditor } from "@/components/admin/modern-article-editor";
import { EMPTY_ARTICLE_DOC } from "@/lib/editor/content";

export default async function NewArticleEditorPage() {
  await requireAdminSession();
  const categories = await listCategories();

  return (
    <ModernArticleEditor
      categories={categories}
      values={{
        title: "",
        seoTitle: "",
        seoDescription: "",
        tagCsv: "",
        categoryId: categories[0]?.id || "",
        featuredImagePath: "",
        contentHtml: "<p></p>",
        contentJson: JSON.stringify(EMPTY_ARTICLE_DOC),
      }}
    />
  );
}
