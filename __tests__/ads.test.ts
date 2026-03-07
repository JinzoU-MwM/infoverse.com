import { afterEach, describe, expect, test } from "vitest";
import { isAdPlaceholderDebugEnabled, shouldShowAdPlaceholderLabel } from "../src/lib/ads";

const originalDebugValue = process.env.NEXT_PUBLIC_AD_PLACEHOLDER_DEBUG;

afterEach(() => {
  if (typeof originalDebugValue === "undefined") {
    delete process.env.NEXT_PUBLIC_AD_PLACEHOLDER_DEBUG;
  } else {
    process.env.NEXT_PUBLIC_AD_PLACEHOLDER_DEBUG = originalDebugValue;
  }
});

describe("ad placeholder visibility", () => {
  test("defaults to hidden labels", () => {
    delete process.env.NEXT_PUBLIC_AD_PLACEHOLDER_DEBUG;
    expect(isAdPlaceholderDebugEnabled()).toBe(false);
    expect(shouldShowAdPlaceholderLabel(false)).toBe(false);
  });

  test("enables labels when debug env is true-like", () => {
    process.env.NEXT_PUBLIC_AD_PLACEHOLDER_DEBUG = "true";
    expect(isAdPlaceholderDebugEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_AD_PLACEHOLDER_DEBUG = "1";
    expect(isAdPlaceholderDebugEnabled()).toBe(true);
  });

  test("editor preview always shows labels", () => {
    process.env.NEXT_PUBLIC_AD_PLACEHOLDER_DEBUG = "false";
    expect(shouldShowAdPlaceholderLabel(true)).toBe(true);
  });
});
