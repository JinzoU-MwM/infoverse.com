import { generateHTML, generateJSON } from "@tiptap/html";
import sanitizeHtml from "sanitize-html";
import type { ArticleContentDoc, SuggestionItem } from "@/lib/types";
import { createEditorExtensions } from "@/lib/editor/extensions";

export const EMPTY_ARTICLE_DOC: ArticleContentDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function fallbackDocFromText(html: string): ArticleContentDoc {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return EMPTY_ARTICLE_DOC;
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

export function parseArticleDoc(raw: string | null | undefined): ArticleContentDoc | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ArticleContentDoc;
    if (parsed && parsed.type === "doc") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function parseSuggestionItems(raw: string | null | undefined): SuggestionItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === "object");
  } catch {
    return [];
  }
}

export function articleHtmlToDoc(html: string): ArticleContentDoc {
  if (!html.trim()) return EMPTY_ARTICLE_DOC;
  try {
    const parsed = generateJSON(html, createEditorExtensions()) as ArticleContentDoc;
    if (parsed && parsed.type === "doc") return parsed;
    return fallbackDocFromText(html);
  } catch {
    return fallbackDocFromText(html);
  }
}

export function articleDocToHtml(doc: ArticleContentDoc): string {
  const rawHtml = generateHTML(doc, createEditorExtensions());
  return sanitizeHtml(rawHtml, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "p",
      "br",
      "strong",
      "em",
      "u",
      "blockquote",
      "pre",
      "code",
      "ul",
      "ol",
      "li",
      "a",
      "figure",
      "img",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      a: ["href", "rel", "target"],
      figure: ["data-type", "data-align", "style"],
      img: ["src", "alt", "style", "data-width", "data-align", "data-caption"],
      figcaption: ["style"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      table: ["style"],
    },
    allowedSchemes: ["http", "https", "data"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    allowProtocolRelative: false,
  });
}

export function ensureArticleDocFromStorage(contentJson: string | null, contentHtml: string): ArticleContentDoc {
  const parsedJson = parseArticleDoc(contentJson);
  if (parsedJson) return parsedJson;
  return articleHtmlToDoc(contentHtml);
}
