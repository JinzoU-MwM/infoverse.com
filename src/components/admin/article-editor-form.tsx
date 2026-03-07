import { saveArticleAction } from "@/app/admin/actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type EditorValues = {
  articleId?: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  tagCsv: string;
  categoryId: string;
  featuredImagePath: string;
  contentHtml: string;
};

export function ArticleEditorForm({
  categories,
  values,
  error,
  saved,
}: {
  categories: Array<{ id: string; name: string }>;
  values: EditorValues;
  error?: string;
  saved?: string;
}) {
  const hasCategories = categories.length > 0;

  return (
    <>
      {error === "validation" ? <Alert tone="error">Validation failed. Complete required fields before saving.</Alert> : null}
      {error === "category" ? <Alert tone="error">Select a valid category before saving.</Alert> : null}
      {!hasCategories ? <Alert tone="warn">Create at least one category before publishing articles.</Alert> : null}
      {saved === "published" ? <Alert tone="success">Article published successfully.</Alert> : null}
      {saved === "draft" ? <Alert tone="success">Draft saved successfully.</Alert> : null}

      <form action={saveArticleAction} className="grid gap-3 lg:grid-cols-[1fr_320px]">
        {values.articleId ? <input type="hidden" name="articleId" value={values.articleId} /> : null}

        <section className="iv-card space-y-3 p-4">
          <Input name="title" defaultValue={values.title} placeholder="Article title" required minLength={8} />
          <RichTextEditor initialHtml={values.contentHtml} />

          <div className="grid gap-3 md:grid-cols-2">
            <Input name="seoTitle" defaultValue={values.seoTitle} placeholder="SEO title" maxLength={120} />
            <Input name="seoDescription" defaultValue={values.seoDescription} placeholder="SEO description" maxLength={180} />
          </div>

          <Input name="tagCsv" defaultValue={values.tagCsv} placeholder="Tags (comma separated)" />

          <div className="grid gap-3 md:grid-cols-2">
            <Button type="submit" name="status" value="draft" variant="outline" disabled={!hasCategories}>
              Save Draft
            </Button>
            <Button type="submit" name="status" value="published" disabled={!hasCategories}>
              Publish
            </Button>
          </div>
          <p className="text-xs text-slate-500">Unsaved and publish-success states are represented with explicit alerts.</p>
        </section>

        <aside className="iv-card space-y-3 p-4">
          <label className="block text-sm text-slate-700">
            Category
            <Select className="mt-1" name="categoryId" required defaultValue={values.categoryId || categories[0]?.id} disabled={!hasCategories}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>

          <ImageUploadField initialPath={values.featuredImagePath} />
          <div className="iv-ad-slot h-20 border-cyan-500 bg-cyan-50 text-cyan-700">In-Article Ad Slot Preview</div>
          <div className="iv-ad-slot h-20">Header Ad Placeholder Tag</div>
        </aside>
      </form>
    </>
  );
}
