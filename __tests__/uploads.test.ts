import { describe, expect, test } from "vitest";
import {
  buildUploadFileName,
  extensionForMimeType,
  resolveUploadDirectory,
  toPublicRelativePath,
} from "../src/lib/uploads";

describe("upload helpers", () => {
  test("extensionForMimeType resolves supported types", () => {
    expect(extensionForMimeType("image/png")).toBe("png");
    expect(extensionForMimeType("image/svg+xml")).toBeNull();
  });

  test("resolveUploadDirectory blocks non-public targets", () => {
    const allowed = resolveUploadDirectory("/app", "public/uploads");
    expect(allowed?.absoluteUploadDir.replace(/\\/g, "/").endsWith("public/uploads")).toBe(true);

    const blocked = resolveUploadDirectory("/app", "../outside");
    expect(blocked).toBeNull();
  });

  test("toPublicRelativePath normalizes separators", () => {
    const rel = toPublicRelativePath("C:/repo/public", "C:/repo/public/uploads/image.jpg");
    expect(rel).toBe("/uploads/image.jpg");
  });

  test("buildUploadFileName includes extension", () => {
    const name = buildUploadFileName("jpg", 1234);
    expect(name.startsWith("1234-")).toBe(true);
    expect(name.endsWith(".jpg")).toBe(true);
  });
});
