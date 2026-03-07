"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { useEffect, useRef, useState } from "react";
import { articleDocToHtml, EMPTY_ARTICLE_DOC } from "@/lib/editor/content";
import { createEditorExtensions } from "@/lib/editor/extensions";
import type { ArticleContentDoc, SuggestionItem, UploadResponse } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EditorMetrics = {
  wordCount: number;
  charCount: number;
  pendingSuggestions: number;
  contentJson: string;
  contentHtml: string;
  suggestionStateJson: string;
};

type Props = {
  initialDoc: ArticleContentDoc;
  initialSuggestions?: SuggestionItem[];
  onChange: (payload: EditorMetrics) => void;
};

type SelectedImageState = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  align: "left" | "center" | "right";
};

function wordsFromText(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function plainTextFromDoc(doc: ArticleContentDoc): string {
  const parts: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const typed = node as { text?: string; content?: unknown[] };
    if (typeof typed.text === "string") parts.push(typed.text);
    if (Array.isArray(typed.content)) typed.content.forEach(walk);
  }

  walk(doc);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function cloneDoc(doc: ArticleContentDoc): ArticleContentDoc {
  return JSON.parse(JSON.stringify(doc)) as ArticleContentDoc;
}

function docsEqual(a: ArticleContentDoc, b: ArticleContentDoc) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function summaryFromDocs(beforeDoc: ArticleContentDoc, afterDoc: ArticleContentDoc) {
  const beforeText = plainTextFromDoc(beforeDoc);
  const afterText = plainTextFromDoc(afterDoc);
  const delta = afterText.length - beforeText.length;
  if (delta > 0) return `Inserted ${delta} characters`;
  if (delta < 0) return `Deleted ${Math.abs(delta)} characters`;
  return "Formatting/content adjustment";
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function currentImageSelection(editor: Editor): SelectedImageState | null {
  const selection = editor.state.selection;
  const node = selection instanceof NodeSelection ? selection.node : editor.state.doc.nodeAt(selection.from);
  if (!node || node.type.name !== "imageBlock") return null;
  return {
    src: String(node.attrs.src || ""),
    alt: String(node.attrs.alt || ""),
    caption: String(node.attrs.caption || ""),
    width: Number(node.attrs.width || 100),
    align: (node.attrs.align || "center") as "left" | "center" | "right",
  };
}

function ToolbarButton({
  active,
  onClick,
  label,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      className="h-8 px-3 py-1 text-xs"
      title={title}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function RichTextEditor({ initialDoc, initialSuggestions = [], onChange }: Props) {
  const [mode, setMode] = useState<"write" | "suggest">("write");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(initialSuggestions);
  const [selectedImage, setSelectedImage] = useState<SelectedImageState | null>(null);
  const [uploadState, setUploadState] = useState<string>("");
  const [docSnapshot, setDocSnapshot] = useState<ArticleContentDoc>(cloneDoc(initialDoc));

  const previousDocRef = useRef<ArticleContentDoc>(cloneDoc(initialDoc));
  const suggestStartDocRef = useRef<ArticleContentDoc | null>(null);
  const latestSuggestDocRef = useRef<ArticleContentDoc | null>(null);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressSuggestionRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createEditorExtensions(),
    content: initialDoc || EMPTY_ARTICLE_DOC,
    editorProps: {
      attributes: {
        class:
          "min-h-[360px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 focus:outline-none",
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!editor || !files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter(isImageFile);
        if (imageFiles.length === 0) return false;

        void Promise.all(imageFiles.map(async (file) => uploadAndInsertImage(file)));
        return true;
      },
      handlePaste: (_view, event) => {
        if (!editor) return false;
        const files = Array.from(event.clipboardData?.files || []).filter(isImageFile);
        if (files.length === 0) return false;

        event.preventDefault();
        void Promise.all(files.map(async (file) => uploadAndInsertImage(file)));
        return true;
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const nextDoc = activeEditor.getJSON() as ArticleContentDoc;
      setDocSnapshot(cloneDoc(nextDoc));
      if (mode === "suggest" && !suppressSuggestionRef.current) {
        if (!suggestStartDocRef.current) {
          suggestStartDocRef.current = cloneDoc(previousDocRef.current);
        }
        latestSuggestDocRef.current = cloneDoc(nextDoc);
        if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
        suggestTimerRef.current = setTimeout(() => {
          const start = suggestStartDocRef.current;
          const latest = latestSuggestDocRef.current;
          if (!start || !latest || docsEqual(start, latest)) {
            suggestStartDocRef.current = null;
            latestSuggestDocRef.current = null;
            return;
          }

          const nextSuggestion: SuggestionItem = {
            id: crypto.randomUUID(),
            summary: summaryFromDocs(start, latest),
            beforeDoc: cloneDoc(start),
            afterDoc: cloneDoc(latest),
            status: "pending",
            createdAt: Date.now(),
          };
          setSuggestions((prev) => [...prev, nextSuggestion]);
          suggestStartDocRef.current = null;
          latestSuggestDocRef.current = null;
        }, 650);
      }
      previousDocRef.current = cloneDoc(nextDoc);
    },
  });

  async function uploadAndInsertImage(file: File) {
    if (!editor) return;
    const tempSrc = URL.createObjectURL(file);
    editor.chain().focus().setImageBlock({ src: tempSrc, caption: "Uploading image...", width: 100, align: "center" }).run();
    setUploadState(`Uploading ${file.name}...`);

    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = (await response.json()) as UploadResponse;

    if (!response.ok || !data.ok) {
      setUploadState(data.ok ? "Upload failed." : data.message);
      return;
    }

    let foundPos: number | null = null;
    let attrs: Record<string, unknown> | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "imageBlock" && node.attrs.src === tempSrc) {
        foundPos = pos;
        attrs = { ...node.attrs };
        return false;
      }
      return true;
    });

    if (foundPos !== null && attrs) {
      const safeAttrs = attrs as Record<string, unknown>;
      const transaction = editor.state.tr.setNodeMarkup(foundPos, undefined, {
        ...safeAttrs,
        src: data.path,
        caption: safeAttrs.caption === "Uploading image..." ? "" : String(safeAttrs.caption || ""),
      });
      editor.view.dispatch(transaction);
    }

    setUploadState("Image inserted.");
  }

  function flushSuggestionBuffer() {
    if (!suggestTimerRef.current) return;
    clearTimeout(suggestTimerRef.current);
    suggestTimerRef.current = null;
    const start = suggestStartDocRef.current;
    const latest = latestSuggestDocRef.current;
    if (!start || !latest || docsEqual(start, latest)) {
      suggestStartDocRef.current = null;
      latestSuggestDocRef.current = null;
      return;
    }

    const nextSuggestion: SuggestionItem = {
      id: crypto.randomUUID(),
      summary: summaryFromDocs(start, latest),
      beforeDoc: cloneDoc(start),
      afterDoc: cloneDoc(latest),
      status: "pending",
      createdAt: Date.now(),
    };
    setSuggestions((prev) => [...prev, nextSuggestion]);
    suggestStartDocRef.current = null;
    latestSuggestDocRef.current = null;
  }

  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => setSelectedImage(currentImageSelection(editor));
    updateSelection();

    editor.on("selectionUpdate", updateSelection);
    editor.on("transaction", updateSelection);
    return () => {
      editor.off("selectionUpdate", updateSelection);
      editor.off("transaction", updateSelection);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const doc = docSnapshot;
    const text = editor.getText({ blockSeparator: " " }).trim();
    onChangeRef.current({
      contentJson: JSON.stringify(doc),
      contentHtml: articleDocToHtml(doc),
      suggestionStateJson: JSON.stringify(suggestions),
      pendingSuggestions: suggestions.filter((item) => item.status === "pending").length,
      wordCount: wordsFromText(text),
      charCount: text.length,
    });
  }, [docSnapshot, editor, suggestions]);

  useEffect(() => {
    if (mode === "write") {
      flushSuggestionBuffer();
      suggestStartDocRef.current = null;
      latestSuggestDocRef.current = null;
    }
  }, [mode]);

  if (!editor) return null;

  const pending = suggestions.filter((item) => item.status === "pending");

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter link URL", previous || "https://");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function acceptSuggestion(item: SuggestionItem) {
    setSuggestions((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, status: "accepted" } : entry)));
  }

  function rejectSuggestion(item: SuggestionItem) {
    if (!editor) return;
    suppressSuggestionRef.current = true;
    editor.commands.setContent(item.beforeDoc, { emitUpdate: false });
    previousDocRef.current = cloneDoc(item.beforeDoc);
    setSuggestions((prev) =>
      prev.map((entry) => (entry.status === "pending" ? { ...entry, status: "rejected" } : entry))
    );
    setTimeout(() => {
      suppressSuggestionRef.current = false;
    }, 0);
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
      <section className="space-y-3">
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <ToolbarButton label="H1" title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
          <ToolbarButton label="H2" title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
          <ToolbarButton label="H3" title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
          <ToolbarButton label="B" title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
          <ToolbarButton label="I" title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
          <ToolbarButton label="U" title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
          <ToolbarButton label="UL" title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <ToolbarButton label="OL" title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <ToolbarButton label="Quote" title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
          <ToolbarButton label="Code" title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
          <ToolbarButton label="Link" title="Insert link" active={editor.isActive("link")} onClick={setLink} />
          <ToolbarButton label="Table" title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
          <ToolbarButton label="Undo" title="Undo" onClick={() => editor.chain().focus().undo().run()} />
          <ToolbarButton label="Redo" title="Redo" onClick={() => editor.chain().focus().redo().run()} />
        </div>

        <EditorContent editor={editor} />

        <p className="text-xs text-slate-500">
          Keyboard shortcuts: Ctrl/Cmd+B, Ctrl/Cmd+I, Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z. Paste or drag-drop images directly into content.
        </p>
      </section>

      <aside className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Editing mode</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "write" ? "secondary" : "outline"}
                className="h-7 px-3 py-0 text-xs"
                onClick={() => setMode("write")}
              >
                Write
              </Button>
              <Button
                type="button"
                variant={mode === "suggest" ? "secondary" : "outline"}
                className="h-7 px-3 py-0 text-xs"
                onClick={() => setMode("suggest")}
              >
                Suggest
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Pending suggestions: <span className="font-semibold text-slate-900">{pending.length}</span>
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {mode === "suggest"
              ? "Changes are tracked as suggestions and must be resolved before publish."
              : "Direct edit mode applies changes immediately."}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Image controls</p>
          {selectedImage ? (
            <div className="space-y-2">
              <Input
                value={selectedImage.alt}
                onChange={(event) => {
                  const next = event.target.value;
                  setSelectedImage((prev) => (prev ? { ...prev, alt: next } : prev));
                  editor.chain().focus().updateImageBlock({ alt: next }).run();
                }}
                placeholder="Alt text"
              />
              <Input
                value={selectedImage.caption}
                onChange={(event) => {
                  const next = event.target.value;
                  setSelectedImage((prev) => (prev ? { ...prev, caption: next } : prev));
                  editor.chain().focus().updateImageBlock({ caption: next }).run();
                }}
                placeholder="Caption"
              />
              <label className="block text-xs text-slate-600">
                Width: {selectedImage.width}%
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={selectedImage.width}
                  onChange={(event) => {
                    const width = Number(event.target.value);
                    setSelectedImage((prev) => (prev ? { ...prev, width } : prev));
                    editor.chain().focus().updateImageBlock({ width }).run();
                  }}
                  className="mt-1 w-full"
                />
              </label>
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((align) => (
                  <Button
                    key={align}
                    type="button"
                    variant={selectedImage.align === align ? "secondary" : "outline"}
                    className="h-7 px-2 py-0 text-xs"
                    onClick={() => {
                      setSelectedImage((prev) => (prev ? { ...prev, align } : prev));
                      editor.chain().focus().updateImageBlock({ align }).run();
                    }}
                  >
                    {align}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select an image block to edit alt text, caption, width, and alignment.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Review queue</p>
          {pending.length === 0 ? (
            <p className="text-xs text-slate-500">No pending suggestions.</p>
          ) : (
            <div className="space-y-2">
              {pending.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <p className="text-xs font-medium text-slate-700">{item.summary}</p>
                  <div className="mt-2 flex gap-2">
                    <Button type="button" className="h-7 px-2 py-0 text-xs" onClick={() => acceptSuggestion(item)}>
                      Accept
                    </Button>
                    <Button type="button" variant="outline" className="h-7 px-2 py-0 text-xs" onClick={() => rejectSuggestion(item)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
          <p>
            Words: <span className="font-semibold text-slate-900">{wordsFromText(editor.getText({ blockSeparator: " " }))}</span>
          </p>
          <p>
            Characters: <span className="font-semibold text-slate-900">{editor.getText({ blockSeparator: " " }).length}</span>
          </p>
        </div>

        {uploadState ? <Alert tone="default">{uploadState}</Alert> : null}
      </aside>
    </div>
  );
}
