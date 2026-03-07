import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import type { SuggestionOptions } from "@tiptap/suggestion";

export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: new PluginKey("slashCommands"),
        command: ({ editor, range, props }) => {
          props.action({ editor, range });
        },
      } as SuggestionOptions,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export type SlashCommandAction = (props: { editor: unknown; range: { from: number; to: number } }) => void;

export type SlashCommandItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  keywords: string[];
  action: SlashCommandAction;
};

export function getSlashCommandItems(editor: unknown): SlashCommandItem[] {
  return [
    {
      id: "paragraph",
      title: "Text",
      description: "Just start writing with plain text.",
      icon: "T",
      keywords: ["text", "paragraph", "p"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { setParagraph: () => { run: () => void } } } }).chain().focus().setParagraph().run();
      },
    },
    {
      id: "heading1",
      title: "Heading 1",
      description: "Big section heading.",
      icon: "H1",
      keywords: ["h1", "heading", "title"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleHeading: (opts: { level: number }) => { run: () => void } } } }).chain().focus().toggleHeading({ level: 1 }).run();
      },
    },
    {
      id: "heading2",
      title: "Heading 2",
      description: "Medium section heading.",
      icon: "H2",
      keywords: ["h2", "heading", "subtitle"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleHeading: (opts: { level: number }) => { run: () => void } } } }).chain().focus().toggleHeading({ level: 2 }).run();
      },
    },
    {
      id: "heading3",
      title: "Heading 3",
      description: "Small section heading.",
      icon: "H3",
      keywords: ["h3", "heading"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleHeading: (opts: { level: number }) => { run: () => void } } } }).chain().focus().toggleHeading({ level: 3 }).run();
      },
    },
    {
      id: "bulletList",
      title: "Bullet List",
      description: "Create a simple bullet list.",
      icon: "*",
      keywords: ["bullet", "list", "ul"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleBulletList: () => { run: () => void } } } }).chain().focus().toggleBulletList().run();
      },
    },
    {
      id: "numberedList",
      title: "Numbered List",
      description: "Create a list with numbering.",
      icon: "1.",
      keywords: ["numbered", "list", "ol"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleOrderedList: () => { run: () => void } } } }).chain().focus().toggleOrderedList().run();
      },
    },
    {
      id: "quote",
      title: "Quote",
      description: "Capture a quote.",
      icon: '"',
      keywords: ["quote", "blockquote"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleBlockquote: () => { run: () => void } } } }).chain().focus().toggleBlockquote().run();
      },
    },
    {
      id: "code",
      title: "Code Block",
      description: "Capture a code snippet.",
      icon: "</>",
      keywords: ["code", "codeblock"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleCodeBlock: () => { run: () => void } } } }).chain().focus().toggleCodeBlock().run();
      },
    },
    {
      id: "divider",
      title: "Divider",
      description: "Visually divide blocks.",
      icon: "-",
      keywords: ["divider", "hr", "separator"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { setHorizontalRule: () => { run: () => void } } } }).chain().focus().setHorizontalRule().run();
      },
    },
    {
      id: "table",
      title: "Table",
      description: "Insert a 3x3 table.",
      icon: "+",
      keywords: ["table", "grid"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { insertTable: (opts: { rows: number; cols: number; withHeaderRow: boolean }) => { run: () => void } } } }).chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      },
    },
  ];
}
