import { describe, expect, test } from "vitest";
import { excerptFromHtml, formatDate, slugify } from "../src/lib/utils";

describe("utils", () => {
  test("slugify normalizes strings", () => {
    expect(slugify("AI Market Outlook 2026!")).toBe("ai-market-outlook-2026");
  });

  test("excerpt strips tags", () => {
    expect(excerptFromHtml("<p>Hello <strong>World</strong></p>")).toBe("Hello World");
  });

  test("formatDate handles null", () => {
    expect(formatDate(null)).toBe("Draft");
  });
});
