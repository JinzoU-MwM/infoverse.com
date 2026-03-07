"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  initialHtml?: string;
  inputName?: string;
};

function button(exec: string, label: string, title: string) {
  return { exec, label, title };
}

const TOOLS = [
  button("bold", "B", "Bold"),
  button("italic", "I", "Italic"),
  button("insertUnorderedList", "UL", "Bullet list"),
  button("formatBlock:h2", "H2", "Heading 2"),
  button("formatBlock:h3", "H3", "Heading 3"),
] as const;

export function RichTextEditor({ initialHtml = "", inputName = "contentHtml" }: Props) {
  const [html, setHtml] = useState(initialHtml);
  const editorRef = useRef<HTMLDivElement | null>(null);

  function run(exec: string) {
    editorRef.current?.focus();
    if (exec.includes(":")) {
      const [command, arg] = exec.split(":");
      document.execCommand(command, false, arg);
    } else {
      document.execCommand(exec, false);
    }
    setHtml(editorRef.current?.innerHTML || "");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((tool) => (
          <Button
            key={tool.exec}
            type="button"
            variant="outline"
            className="px-3 py-1 text-xs"
            title={tool.title}
            onClick={() => run(tool.exec)}
          >
            {tool.label}
          </Button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[260px] rounded-xl border border-slate-300 bg-white p-3 text-sm"
        onInput={() => setHtml(editorRef.current?.innerHTML || "")}
        dangerouslySetInnerHTML={{ __html: initialHtml || "<p>Write article content...</p>" }}
      />
      <input type="hidden" name={inputName} value={html} />
      <p className="text-xs text-slate-500">Unsaved changes appear instantly here before submit.</p>
    </div>
  );
}
