import { describe, expect, test } from "vitest";
import { coerceRole } from "../src/lib/auth/session";

describe("auth role coercion", () => {
  test("keeps owner role", () => {
    expect(coerceRole("owner")).toBe("owner");
  });

  test("falls back to editor for unknown values", () => {
    expect(coerceRole("admin")).toBe("editor");
    expect(coerceRole(undefined)).toBe("editor");
  });
});
