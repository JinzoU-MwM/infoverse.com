"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";

type Props = {
  editor: Editor;
};

type ToolbarButton = {
  id: string;
  label: string;
  title: string;
  isActive: () => boolean;
  onClick: () => void;
};

export function FloatingToolbar({ editor }: Props) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateToolbar = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setVisible(false);
        return;
      }

      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const centerX = (start.left + end.left) / 2;

      const toolbarWidth = toolbarRef.current?.offsetWidth || 300;
      const left = Math.max(10, Math.min(centerX - toolbarWidth / 2, window.innerWidth - toolbarWidth - 10));
      const top = start.top - 48 - 8;

      if (top < 10) {
        setVisible(false);
        return;
      }

      setPosition({ top, left });
      setVisible(true);
    };

    editor.on("selectionUpdate", updateToolbar);
    editor.on("transaction", updateToolbar);

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("transaction", updateToolbar);
    };
  }, [editor]);

  const buttons: ToolbarButton[] = [
    { id: "bold", label: "B", title: "Bold (Ctrl+B)", isActive: () => editor.isActive("bold"), onClick: () => editor.chain().focus().toggleBold().run() },
    { id: "italic", label: "I", title: "Italic (Ctrl+I)", isActive: () => editor.isActive("italic"), onClick: () => editor.chain().focus().toggleItalic().run() },
    { id: "underline", label: "U", title: "Underline (Ctrl+U)", isActive: () => editor.isActive("underline"), onClick: () => editor.chain().focus().toggleUnderline().run() },
    { id: "strike", label: "S", title: "Strikethrough", isActive: () => editor.isActive("strike"), onClick: () => editor.chain().focus().toggleStrike().run() },
    { id: "h1", label: "H1", title: "Heading 1", isActive: () => editor.isActive("heading", { level: 1 }), onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { id: "h2", label: "H2", title: "Heading 2", isActive: () => editor.isActive("heading", { level: 2 }), onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: "quote", label: '"', title: "Blockquote", isActive: () => editor.isActive("blockquote"), onClick: () => editor.chain().focus().toggleBlockquote().run() },
    { id: "link", label: "🔗", title: "Add link", isActive: () => editor.isActive("link"), onClick: () => { const url = window.prompt("Enter URL:", "https://"); if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run(); } },
  ];

  if (!visible) return null;

  return (
    <div ref={toolbarRef} className="fixed z-50 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg" style={{ top: position.top, left: position.left }}>
      {buttons.map((btn) => (
        <Button key={btn.id} type="button" variant={btn.isActive() ? "secondary" : "outline"} className="h-8 w-8 p-0 text-sm font-semibold" title={btn.title} onClick={btn.onClick}>
          {btn.label}
        </Button>
      ))}
    </div>
  );
}
