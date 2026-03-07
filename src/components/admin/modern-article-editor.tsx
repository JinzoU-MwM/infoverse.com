"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import { saveArticleAction } from "@/app/admin/actions";
import { FloatingToolbar } from "@/components/admin/floating-toolbar";
import { EditorStatusBar } from "@/components/admin/editor-status-bar";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createEditorExtensions } from "@/lib/editor/extensions";
import type { ArticleContentDoc, AutosaveState, EditorValues } from "@/lib/types";
import { articleDocToHtml, EMPTY_ARTICLE_DOC } from "@/lib/editor/content";

type Props = {
  categories: Array<{ id: string; name: string }>;
  values: EditorValues;
  error?: string;
  saved?: string;
};

export function ModernArticleEditor({ categories, values }: Props) {
  const [title, setTitle] = useState(values.title);
  const [seoTitle, setSeoTitle] = useState(values.seoTitle);
  const [seoDescription, setSeoDescription] = useState(values.seoDescription);
  const [tagCsv, setTagCsv] = useState(values.tagCsv);
  const [categoryId, setCategoryId] = useState(values.categoryId || categories[0]?.id || "");
  const [featuredImagePath, setFeaturedImagePath] = useState(values.featuredImagePath);
  const [contentJson, setContentJson] = useState(values.contentJson);
  const [contentHtml, setContentHtml] = useState(values.contentHtml);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  let parsedInitialDoc: ArticleContentDoc;
  try {
    parsedInitialDoc = JSON.parse(values.contentJson) as ArticleContentDoc;
  } catch {
    parsedInitialDoc = EMPTY_ARTICLE_DOC;
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createEditorExtensions(),
    content: parsedInitialDoc,
    editorProps: {
      attributes: {
        class: "iv-editor-canvas",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const json = activeEditor.getJSON() as ArticleContentDoc;
      const text = activeEditor.getText({ blockSeparator: " " }).trim();
      setContentJson(JSON.stringify(json));
      setContentHtml(articleDocToHtml(json));
      setWordCount(text ? text.split(/\s+/).length : 0);
      setCharCount(text.length);
      scheduleAutosave();
    },
  });

  const runAutosave = useCallback(async () => {
    if (!values.articleId) return;

    setAutosaveState("saving");
    try {
      const response = await fetch(`/api/admin/articles/${values.articleId}/autosave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          seoTitle,
          seoDescription,
          tagCsv,
          categoryId,
          featuredImagePath,
          contentJson,
        }),
      });

      if (!response.ok) {
        setAutosaveState("failed");
        return;
      }

      setAutosaveState("saved");
      setLastSaved(new Date());
    } catch {
      setAutosaveState("failed");
    }
  }, [values.articleId, title, seoTitle, seoDescription, tagCsv, categoryId, featuredImagePath, contentJson]);

  const scheduleAutosave = useCallback(() => {
    if (!values.articleId) {
      setAutosaveState("unsaved");
      return;
    }

    setAutosaveState("unsaved");
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void runAutosave();
    }, 900);
  }, [values.articleId, runAutosave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  if (!editor) return null;

  const editorContent = (
    <>
      {editor && <FloatingToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </>
  );

  if (focusMode) {
    return (
      <div className="iv-focus-mode">
        <button
          className="iv-focus-mode-close"
          onClick={() => setFocusMode(false)}
          aria-label="Exit focus mode"
        >
          ×
        </button>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleAutosave();
            }}
            placeholder="Article title..."
            className="mb-4 w-full border-b-2 border-transparent bg-transparent pb-2 text-3xl font-bold outline-none focus:border-slate-300"
          />
          {editorContent}
        </div>
        <EditorStatusBar
          wordCount={wordCount}
          charCount={charCount}
          autosaveState={autosaveState}
          lastSaved={lastSaved}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-slate-500 hover:text-slate-700">
            ← Back
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleAutosave();
            }}
            placeholder="Article title..."
            className="text-xl font-semibold outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFocusMode(true)}>
            Focus
          </Button>
          <Button variant="outline" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "Hide" : "Show"} Sidebar
          </Button>
          <form action={saveArticleAction} className="flex gap-2">
            {values.articleId && <input type="hidden" name="articleId" value={values.articleId} />}
            <input type="hidden" name="contentHtml" value={contentHtml} />
            <input type="hidden" name="contentJson" value={contentJson} />
            <input type="hidden" name="categoryId" value={categoryId} />
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="seoTitle" value={seoTitle} />
            <input type="hidden" name="seoDescription" value={seoDescription} />
            <input type="hidden" name="tagCsv" value={tagCsv} />
            <input type="hidden" name="featuredImagePath" value={featuredImagePath} />
            <Button type="submit" name="status" value="draft" variant="outline">
              Save Draft
            </Button>
            <Button type="submit" name="status" value="published">
              Publish
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Editor */}
        <main className="flex-1 overflow-y-auto py-8">
          {editorContent}
        </main>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-4">
            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>
                <Select
                  name="categoryId"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    scheduleAutosave();
                  }}
                  className="w-full"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Featured Image */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Featured Image
                </label>
                <ImageUploadField
                  initialPath={featuredImagePath}
                  onChangePath={(path) => {
                    setFeaturedImagePath(path);
                    scheduleAutosave();
                  }}
                />
              </div>

              {/* SEO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  SEO Title
                </label>
                <Input
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    scheduleAutosave();
                  }}
                  placeholder="SEO title..."
                  maxLength={120}
                />
                <p className="mt-1 text-xs text-slate-500">{seoTitle.length}/120</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  SEO Description
                </label>
                <Input
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoDescription(e.target.value);
                    scheduleAutosave();
                  }}
                  placeholder="SEO description..."
                  maxLength={180}
                />
                <p className="mt-1 text-xs text-slate-500">{seoDescription.length}/180</p>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tags
                </label>
                <Input
                  value={tagCsv}
                  onChange={(e) => {
                    setTagCsv(e.target.value);
                    scheduleAutosave();
                  }}
                  placeholder="tag1, tag2, tag3"
                />
                <p className="mt-1 text-xs text-slate-500">Comma-separated</p>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Status Bar */}
      <EditorStatusBar
        wordCount={wordCount}
        charCount={charCount}
        autosaveState={autosaveState}
        lastSaved={lastSaved}
      />
    </div>
  );
}
