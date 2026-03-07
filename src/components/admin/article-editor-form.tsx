"use client";

import { useEffect, useRef, useState } from "react";
import { saveArticleAction } from "@/app/admin/actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { AdSlot } from "@/components/site/ad-slot";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ArticleContentDoc, AutosaveState, SuggestionItem } from "@/lib/types";

type EditorValues = {
  articleId?: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  tagCsv: string;
  categoryId: string;
  featuredImagePath: string;
  contentHtml: string;
  contentJson: string;
  suggestionStateJson: string;
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
  const [title, setTitle] = useState(values.title);
  const [seoTitle, setSeoTitle] = useState(values.seoTitle);
  const [seoDescription, setSeoDescription] = useState(values.seoDescription);
  const [tagCsv, setTagCsv] = useState(values.tagCsv);
  const [categoryId, setCategoryId] = useState(values.categoryId || categories[0]?.id || "");
  const [featuredImagePath, setFeaturedImagePath] = useState(values.featuredImagePath);
  const [contentHtml, setContentHtml] = useState(values.contentHtml);
  const [contentJson, setContentJson] = useState(values.contentJson);
  const [suggestionStateJson, setSuggestionStateJson] = useState(values.suggestionStateJson);
  const [pendingSuggestions, setPendingSuggestions] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  async function runAutosave(nextState: {
    title: string;
    seoTitle: string;
    seoDescription: string;
    tagCsv: string;
    categoryId: string;
    featuredImagePath: string;
    contentJson: string;
    suggestionStateJson: string;
  }) {
    if (!values.articleId) {
      setAutosaveState("unsaved");
      return;
    }

    setAutosaveState("saving");
    try {
      const response = await fetch(`/api/admin/articles/${values.articleId}/autosave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextState),
      });
      if (!response.ok) {
        setAutosaveState("failed");
        return;
      }
      setAutosaveState("saved");
    } catch {
      setAutosaveState("failed");
    }
  }

  function scheduleAutosave(partial?: Partial<Parameters<typeof runAutosave>[0]>) {
    if (!values.articleId) {
      setAutosaveState("unsaved");
      return;
    }

    const snapshot = {
      title,
      seoTitle,
      seoDescription,
      tagCsv,
      categoryId,
      featuredImagePath,
      contentJson,
      suggestionStateJson,
      ...partial,
    };

    setAutosaveState("unsaved");
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void runAutosave(snapshot);
    }, 900);
  }

  let parsedInitialDoc: ArticleContentDoc;
  try {
    parsedInitialDoc = JSON.parse(values.contentJson) as ArticleContentDoc;
  } catch {
    parsedInitialDoc = { type: "doc", content: [{ type: "paragraph" }] };
  }

  let parsedSuggestionState: SuggestionItem[] = [];
  try {
    const parsed = JSON.parse(values.suggestionStateJson);
    parsedSuggestionState = Array.isArray(parsed) ? (parsed as SuggestionItem[]) : [];
  } catch {
    parsedSuggestionState = [];
  }

  return (
    <>
      {error === "validation" ? <Alert tone="error">Validation failed. Complete required fields before saving.</Alert> : null}
      {error === "category" ? <Alert tone="error">Select a valid category before saving.</Alert> : null}
      {error === "pending-suggestions" ? <Alert tone="warn">Resolve all suggestions before publishing.</Alert> : null}
      {!hasCategories ? <Alert tone="warn">Create at least one category before publishing articles.</Alert> : null}
      {saved === "published" ? <Alert tone="success">Article published successfully.</Alert> : null}
      {saved === "draft" ? <Alert tone="success">Draft saved successfully.</Alert> : null}
      {autosaveState === "saving" ? <Alert tone="default">Saving...</Alert> : null}
      {autosaveState === "saved" ? <Alert tone="success">Saved</Alert> : null}
      {autosaveState === "unsaved" ? <Alert tone="warn">Unsaved changes</Alert> : null}
      {autosaveState === "failed" ? <Alert tone="error">Save failed. Retry by pressing Save Draft.</Alert> : null}

      <form action={saveArticleAction} className="grid gap-3 lg:grid-cols-[1fr_320px]">
        {values.articleId ? <input type="hidden" name="articleId" value={values.articleId} /> : null}
        <input type="hidden" name="contentHtml" value={contentHtml} />
        <input type="hidden" name="contentJson" value={contentJson} />
        <input type="hidden" name="suggestionStateJson" value={suggestionStateJson} />
        <input type="hidden" name="pendingSuggestions" value={pendingSuggestions} />

        <section className="iv-card space-y-3 p-4">
          <Input
            name="title"
            value={title}
            onChange={(event) => {
              const next = event.target.value;
              setTitle(next);
              scheduleAutosave({ title: next });
            }}
            placeholder="Article title"
            required
            minLength={8}
          />
          <RichTextEditor
            initialDoc={parsedInitialDoc}
            initialSuggestions={parsedSuggestionState}
            onChange={(payload) => {
              const changed =
                payload.contentJson !== contentJson ||
                payload.contentHtml !== contentHtml ||
                payload.suggestionStateJson !== suggestionStateJson ||
                payload.pendingSuggestions !== pendingSuggestions;
              setContentJson(payload.contentJson);
              setContentHtml(payload.contentHtml);
              setSuggestionStateJson(payload.suggestionStateJson);
              setPendingSuggestions(payload.pendingSuggestions);
              setWordCount(payload.wordCount);
              setCharCount(payload.charCount);
              if (changed) {
                scheduleAutosave({
                  contentJson: payload.contentJson,
                  suggestionStateJson: payload.suggestionStateJson,
                });
              }
            }}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              name="seoTitle"
              value={seoTitle}
              onChange={(event) => {
                const next = event.target.value;
                setSeoTitle(next);
                scheduleAutosave({ seoTitle: next });
              }}
              placeholder="SEO title"
              maxLength={120}
            />
            <Input
              name="seoDescription"
              value={seoDescription}
              onChange={(event) => {
                const next = event.target.value;
                setSeoDescription(next);
                scheduleAutosave({ seoDescription: next });
              }}
              placeholder="SEO description"
              maxLength={180}
            />
          </div>

          <Input
            name="tagCsv"
            value={tagCsv}
            onChange={(event) => {
              const next = event.target.value;
              setTagCsv(next);
              scheduleAutosave({ tagCsv: next });
            }}
            placeholder="Tags (comma separated)"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Button type="submit" name="status" value="draft" variant="outline" disabled={!hasCategories}>
              Save Draft
            </Button>
            <Button type="submit" name="status" value="published" disabled={!hasCategories || pendingSuggestions > 0}>
              Publish
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Words: {wordCount} | Characters: {charCount} | Pending suggestions: {pendingSuggestions}
          </p>
        </section>

        <aside className="iv-card space-y-3 p-4">
          <label className="block text-sm text-slate-700">
            Category
            <Select
              className="mt-1"
              name="categoryId"
              required
              value={categoryId}
              onChange={(event) => {
                const next = event.target.value;
                setCategoryId(next);
                scheduleAutosave({ categoryId: next });
              }}
              disabled={!hasCategories}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>

          <ImageUploadField
            initialPath={featuredImagePath}
            onChangePath={(nextPath) => {
              setFeaturedImagePath(nextPath);
              scheduleAutosave({ featuredImagePath: nextPath });
            }}
          />
          <AdSlot slot="IN_ARTICLE" className="h-20" editorPreview />
          <AdSlot slot="HEADER" className="h-20" editorPreview />
        </aside>
      </form>
    </>
  );
}
