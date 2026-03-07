import { beforeAll, describe, expect, test } from "vitest";
import { db, sqliteClient } from "../src/lib/db/client";
import { ensureDbInitialized } from "../src/lib/db/init";
import { articleTags, articles, categories, tags, users } from "../src/lib/db/schema";
import { searchPublishedArticles } from "../src/lib/content/queries";

beforeAll(() => {
  ensureDbInitialized();
  sqliteClient.exec(`
    DELETE FROM article_tags;
    DELETE FROM tags;
    DELETE FROM media_assets;
    DELETE FROM sessions;
    DELETE FROM accounts;
    DELETE FROM verifications;
    DELETE FROM articles;
    DELETE FROM categories;
    DELETE FROM users;
  `);

  const userId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();

  db.insert(users)
    .values({
      id: userId,
      name: "Owner",
      email: "owner@test.dev",
      emailVerified: true,
      image: null,
      passwordHash: "hash",
      role: "owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();

  db.insert(categories)
    .values({
      id: categoryId,
      name: "Technology",
      slug: "technology",
      createdAt: Date.now(),
    })
    .run();

  const strongTitleId = crypto.randomUUID();
  const strongTagId = crypto.randomUUID();
  const strongContentId = crypto.randomUUID();

  db.insert(articles)
    .values([
      {
        id: strongTitleId,
        title: "Semiconductor Outlook 2026",
        slug: "semiconductor-outlook-2026",
        contentHtml: "<p>General market narrative for investors.</p>",
        seoTitle: "Semiconductor Outlook 2026",
        seoDescription: "Macro outlook",
        featuredImagePath: null,
        status: "published",
        categoryId,
        authorId: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        publishedAt: Date.now(),
      },
      {
        id: strongTagId,
        title: "Global Supply Chain Recovery",
        slug: "global-supply-chain-recovery",
        contentHtml: "<p>Logistics and ports improve gradually.</p>",
        seoTitle: "Global Supply Chain Recovery",
        seoDescription: "Supply chain summary",
        featuredImagePath: null,
        status: "published",
        categoryId,
        authorId: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        publishedAt: Date.now() - 1000,
      },
      {
        id: strongContentId,
        title: "Manufacturing Pulse",
        slug: "manufacturing-pulse",
        contentHtml: "<p>Semiconductor fabs are adding capacity this year.</p>",
        seoTitle: "Manufacturing Pulse",
        seoDescription: "Manufacturing update",
        featuredImagePath: null,
        status: "published",
        categoryId,
        authorId: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        publishedAt: Date.now() - 2000,
      },
    ])
    .run();

  const semiconductorTagId = crypto.randomUUID();
  db.insert(tags).values({ id: semiconductorTagId, name: "Semiconductor", slug: "semiconductor" }).run();
  db.insert(articleTags).values({ articleId: strongTagId, tagId: semiconductorTagId }).run();
});

describe("content queries", () => {
  test("searchPublishedArticles returns weighted results", async () => {
    const result = await searchPublishedArticles("semiconductor");
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result[0]?.slug).toBe("semiconductor-outlook-2026");
    expect(result[1]?.slug).toBe("global-supply-chain-recovery");
  });
});
