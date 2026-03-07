import { describe, expect, test } from "vitest";
import { ROUTE_ALIASES, getAliasRedirects } from "../src/lib/routing/aliases";

describe("route aliases", () => {
  test("contains the complete paper alias map", () => {
    expect(ROUTE_ALIASES).toHaveLength(14);

    const sourceSet = new Set(ROUTE_ALIASES.map((alias) => alias.source));
    expect(sourceSet).toContain("/home");
    expect(sourceSet).toContain("/about-us");
    expect(sourceSet).toContain("/contact-us");
    expect(sourceSet).toContain("/search-results");
    expect(sourceSet).toContain("/newsletter-landing");
    expect(sourceSet).toContain("/podcast-video-hub");
    expect(sourceSet).toContain("/podcast");
    expect(sourceSet).toContain("/video-hub");
    expect(sourceSet).toContain("/admin-login");
    expect(sourceSet).toContain("/admin-dashboard");
    expect(sourceSet).toContain("/admin-article-editor");
    expect(sourceSet).toContain("/author-profile/:slug");
    expect(sourceSet).toContain("/article-detail/:slug");
    expect(sourceSet).toContain("/tag-topic/:slug");
  });

  test("builds permanent redirects for all aliases", () => {
    const redirects = getAliasRedirects();

    expect(redirects).toHaveLength(14);
    expect(redirects.every((item) => item.permanent)).toBe(true);
    expect(redirects.find((item) => item.source === "/article-detail/:slug")?.destination).toBe("/article/:slug");
    expect(redirects.find((item) => item.source === "/author-profile/:slug")?.destination).toBe("/author/:slug");
  });
});
