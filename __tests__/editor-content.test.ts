import { describe, expect, test } from "vitest";
import {
  articleDocToHtml,
  articleHtmlToDoc,
  ensureArticleDocFromStorage,
  parseArticleDoc,
  parseSuggestionItems,
} from "../src/lib/editor/content";

describe("editor content utilities", () => {
  test("parses json doc strings", () => {
    const parsed = parseArticleDoc(JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }));
    expect(parsed?.type).toBe("doc");
  });

  test("converts html to doc and back to html", () => {
    const doc = articleHtmlToDoc("<p>Hello <strong>World</strong></p>");
    const html = articleDocToHtml(doc);
    expect(html).toContain("Hello");
    expect(html).toContain("World");
  });

  test("falls back to html when json missing", () => {
    const doc = ensureArticleDocFromStorage(null, "<p>Legacy HTML</p>");
    expect(doc.type).toBe("doc");
  });

  test("parses suggestion array safely", () => {
    const items = parseSuggestionItems('[{"id":"1","summary":"x","beforeDoc":{"type":"doc"},"afterDoc":{"type":"doc"},"status":"pending","createdAt":1}]');
    expect(items).toHaveLength(1);
  });
});
