import { describe, expect, test } from "vitest";
import { articleSchema, contactSchema, loginSchema } from "../src/lib/validation";

describe("validation", () => {
  test("login schema accepts valid input", () => {
    const parsed = loginSchema.safeParse({ email: "owner@infoverse.com", password: "secret123" });
    expect(parsed.success).toBe(true);
  });

  test("contact schema rejects short messages", () => {
    const parsed = contactSchema.safeParse({ email: "x@y.com", message: "short" });
    expect(parsed.success).toBe(false);
  });

  test("article schema enforces minimum title", () => {
    const parsed = articleSchema.safeParse({
      title: "short",
      categoryId: "1",
      status: "draft",
      contentHtml: "<p>Too short</p>",
    });
    expect(parsed.success).toBe(false);
  });
});
