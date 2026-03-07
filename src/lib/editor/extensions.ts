import { Node, mergeAttributes } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

type ImageBlockOptions = {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  align?: "left" | "center" | "right";
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (options: ImageBlockOptions) => ReturnType;
      updateImageBlock: (options: Partial<ImageBlockOptions>) => ReturnType;
    };
  }
}

export const ImageBlock = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: "",
      },
      caption: {
        default: "",
      },
      width: {
        default: 100,
      },
      align: {
        default: "center",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-type='image-block']",
        getAttrs: (node) => {
          const figure = node as HTMLElement;
          const img = figure.querySelector("img");
          const caption = figure.querySelector("figcaption");
          const widthRaw = img?.getAttribute("data-width") || img?.style.width.replace("%", "") || "100";
          const width = Number.parseInt(widthRaw, 10);
          const align = (figure.getAttribute("data-align") || "center") as "left" | "center" | "right";
          return {
            src: img?.getAttribute("src") || "",
            alt: img?.getAttribute("alt") || "",
            caption: caption?.textContent || "",
            width: Number.isFinite(width) ? width : 100,
            align,
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (node) => {
          const img = node as HTMLImageElement;
          const widthRaw = img.getAttribute("data-width") || img.style.width.replace("%", "") || "100";
          const width = Number.parseInt(widthRaw, 10);
          return {
            src: img.getAttribute("src") || "",
            alt: img.getAttribute("alt") || "",
            caption: img.getAttribute("data-caption") || "",
            width: Number.isFinite(width) ? width : 100,
            align: (img.getAttribute("data-align") || "center") as "left" | "center" | "right",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = String(HTMLAttributes.src || "");
    const alt = String(HTMLAttributes.alt || "");
    const caption = String(HTMLAttributes.caption || "");
    const align = (HTMLAttributes.align || "center") as "left" | "center" | "right";
    const width = Number(HTMLAttributes.width || 100);

    const clampedWidth = Number.isFinite(width) ? Math.min(100, Math.max(20, width)) : 100;
    const figureStyle = `text-align:${align}; margin: 1rem 0;`;
    const imgStyle = `width:${clampedWidth}%; max-width:100%; height:auto; border-radius: 0.5rem;`;

    return [
      "figure",
      mergeAttributes({ "data-type": "image-block", "data-align": align, style: figureStyle }),
      ["img", { src, alt, "data-width": String(clampedWidth), "data-align": align, "data-caption": caption, style: imgStyle }],
      caption ? ["figcaption", { style: "margin-top:0.35rem;color:#64748b;font-size:0.85rem;" }, caption] : ["figcaption", { style: "display:none;" }, ""],
    ];
  },

  addCommands() {
    return {
      setImageBlock:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt || "",
              caption: options.caption || "",
              width: options.width || 100,
              align: options.align || "center",
            },
          }),
      updateImageBlock:
        (options) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, options),
    };
  },
});

export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      link: false,
      underline: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({
      placeholder: "Write article content...",
    }),
    ImageBlock,
  ];
}
