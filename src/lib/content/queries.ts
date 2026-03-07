import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ensureDbInitialized } from "@/lib/db/init";
import { articleTags, articles, categories, tags, users } from "@/lib/db/schema";
import type { ArticleDetail, ArticleListItem, CategorySummary, SearchResultItem } from "@/lib/types";
import { excerptFromHtml, slugify } from "@/lib/utils";

function mapArticleRow(row: {
  article: typeof articles.$inferSelect;
  categoryName: string;
  authorName: string;
}): ArticleListItem {
  return {
    id: row.article.id,
    slug: row.article.slug,
    title: row.article.title,
    excerpt: excerptFromHtml(row.article.contentHtml),
    categoryName: row.categoryName,
    authorName: row.authorName,
    featuredImagePath: row.article.featuredImagePath,
    publishedAt: row.article.publishedAt ? new Date(row.article.publishedAt).toISOString() : null,
    status: row.article.status,
  };
}

export function getTrendingTopicLinks() {
  return [
    { label: "AI investment momentum", href: "/search?q=ai+investment" },
    { label: "Inflation data surprises", href: "/search?q=inflation" },
    { label: "Energy transition capital map", href: "/search?q=energy+transition" },
    { label: "Semiconductor export shifts", href: "/search?q=semiconductor" },
  ];
}

export async function listPublishedArticles(limit = 9) {
  ensureDbInitialized();
  const rows = db
    .select({ article: articles, categoryName: categories.name, authorName: users.name })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .all();

  return rows.map(mapArticleRow);
}

export async function listPublishedArticlesByCategory(slug: string) {
  ensureDbInitialized();
  const rows = db
    .select({ article: articles, categoryName: categories.name, authorName: users.name })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.status, "published"), eq(categories.slug, slug)))
    .orderBy(desc(articles.publishedAt))
    .all();

  return rows.map(mapArticleRow);
}

export async function listCategories(): Promise<CategorySummary[]> {
  ensureDbInitialized();
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(categories.name)
    .all();
}

export async function listCategoriesWithArticleCount() {
  ensureDbInitialized();
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      articleCount: sql<number>`count(${articles.id})`,
    })
    .from(categories)
    .leftJoin(articles, eq(articles.categoryId, categories.id))
    .groupBy(categories.id, categories.name, categories.slug)
    .orderBy(categories.name)
    .all();
}

export async function getCategoryBySlug(slug: string) {
  ensureDbInitialized();
  const category = db.select().from(categories).where(eq(categories.slug, slug)).limit(1).get();
  return category || null;
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  ensureDbInitialized();
  const row = db
    .select({ article: articles, categoryName: categories.name, authorName: users.name })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .limit(1)
    .get();

  if (!row) return null;

  const tagRows = db
    .select({ id: tags.id, slug: tags.slug, name: tags.name })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, row.article.id))
    .all();

  return {
    ...mapArticleRow(row),
    contentHtml: row.article.contentHtml,
    seoTitle: row.article.seoTitle,
    seoDescription: row.article.seoDescription,
    tags: tagRows,
  };
}

export async function getAdminArticleById(id: string) {
  ensureDbInitialized();
  const row = db
    .select({ article: articles, categoryName: categories.name, authorName: users.name })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.id, id))
    .limit(1)
    .get();

  if (!row) return null;

  const tagRows = db
    .select({ name: tags.name })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, id))
    .all();

  return {
    ...row.article,
    categoryName: row.categoryName,
    authorName: row.authorName,
    tagCsv: tagRows.map((tag) => tag.name).join(", "),
  };
}

export async function getRelatedArticles(articleId: string, categoryId: string, tagIds: string[]) {
  ensureDbInitialized();

  if (tagIds.length > 0) {
    const byTag = db
      .selectDistinct({ article: articles, categoryName: categories.name, authorName: users.name })
      .from(articleTags)
      .innerJoin(articles, eq(articleTags.articleId, articles.id))
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .innerJoin(users, eq(articles.authorId, users.id))
      .where(and(eq(articles.status, "published"), inArray(articleTags.tagId, tagIds), sql`${articles.id} != ${articleId}`))
      .limit(4)
      .all();

    if (byTag.length > 0) return byTag.map(mapArticleRow);
  }

  const byCategory = db
    .select({ article: articles, categoryName: categories.name, authorName: users.name })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.status, "published"), eq(articles.categoryId, categoryId), sql`${articles.id} != ${articleId}`))
    .orderBy(desc(articles.publishedAt))
    .limit(4)
    .all();

  return byCategory.map(mapArticleRow);
}

export async function searchPublishedArticles(query: string): Promise<SearchResultItem[]> {
  ensureDbInitialized();
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const pattern = `%${q}%`;

  const titleMatch = sql<boolean>`lower(${articles.title}) LIKE ${pattern}`;
  const tagMatch = sql<boolean>`EXISTS (
    SELECT 1
    FROM article_tags at
    INNER JOIN tags t ON t.id = at.tag_id
    WHERE at.article_id = ${articles.id}
      AND lower(t.name) LIKE ${pattern}
  )`;
  const categoryMatch = sql<boolean>`lower(${categories.name}) LIKE ${pattern}`;
  const contentMatch = sql<boolean>`lower(${articles.contentHtml}) LIKE ${pattern}`;
  const authorMatch = sql<boolean>`lower(${users.name}) LIKE ${pattern}`;

  const weightedScore = sql<number>`
    (CASE WHEN ${titleMatch} THEN 120 ELSE 0 END) +
    (CASE WHEN ${tagMatch} THEN 80 ELSE 0 END) +
    (CASE WHEN ${categoryMatch} THEN 40 ELSE 0 END) +
    (CASE WHEN ${contentMatch} THEN 20 ELSE 0 END) +
    (CASE WHEN ${authorMatch} THEN 15 ELSE 0 END)
  `;

  const rows = db
    .select({
      article: articles,
      categoryName: categories.name,
      authorName: users.name,
      score: weightedScore,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(
      and(
        eq(articles.status, "published"),
        or(titleMatch, tagMatch, categoryMatch, contentMatch, authorMatch),
      ),
    )
    .orderBy(desc(weightedScore), desc(articles.publishedAt))
    .limit(40)
    .all();

  return rows.map((row) => ({
    id: row.article.id,
    slug: row.article.slug,
    title: row.article.title,
    excerpt: excerptFromHtml(row.article.contentHtml),
    categoryName: row.categoryName,
    authorName: row.authorName,
    publishedAt: row.article.publishedAt ? new Date(row.article.publishedAt).toISOString() : null,
  }));
}

export async function listArticlesByAuthor(authorSlug: string) {
  ensureDbInitialized();
  const normalized = authorSlug.replace(/-/g, " ").toLowerCase();

  const author = db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(sql`lower(${users.name}) = ${normalized}`)
    .limit(1)
    .get();

  if (!author) return { author: null, articles: [] as ArticleListItem[] };

  const rows = db
    .select({ article: articles, categoryName: categories.name, authorName: users.name })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.authorId, author.id), eq(articles.status, "published")))
    .orderBy(desc(articles.publishedAt))
    .all();

  return { author, articles: rows.map(mapArticleRow) };
}

export async function listArticlesByTag(tagSlug: string) {
  ensureDbInitialized();
  const tag = db.select().from(tags).where(eq(tags.slug, tagSlug)).limit(1).get();
  if (!tag) return { tag: null, articles: [] as ArticleListItem[] };

  const rows = db
    .selectDistinct({ article: articles, categoryName: categories.name, authorName: users.name })
    .from(articleTags)
    .innerJoin(articles, eq(articleTags.articleId, articles.id))
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articleTags.tagId, tag.id), eq(articles.status, "published")))
    .orderBy(desc(articles.publishedAt))
    .all();

  return { tag, articles: rows.map(mapArticleRow) };
}

export async function listAdminArticles() {
  ensureDbInitialized();
  return db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      status: articles.status,
      updatedAt: articles.updatedAt,
      categoryName: categories.name,
      authorName: users.name,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .orderBy(desc(articles.updatedAt))
    .all();
}

export async function listSitemapPublicEntities() {
  ensureDbInitialized();

  const articleRows = db
    .select({ slug: articles.slug })
    .from(articles)
    .where(eq(articles.status, "published"))
    .all();

  const categoryRows = db
    .selectDistinct({ slug: categories.slug })
    .from(categories)
    .innerJoin(articles, eq(articles.categoryId, categories.id))
    .where(eq(articles.status, "published"))
    .all();

  const tagRows = db
    .selectDistinct({ slug: tags.slug })
    .from(tags)
    .innerJoin(articleTags, eq(articleTags.tagId, tags.id))
    .innerJoin(articles, eq(articleTags.articleId, articles.id))
    .where(eq(articles.status, "published"))
    .all();

  const authorRows = db
    .selectDistinct({ name: users.name })
    .from(users)
    .innerJoin(articles, eq(articles.authorId, users.id))
    .where(eq(articles.status, "published"))
    .all();

  return {
    articleSlugs: articleRows.map((row) => row.slug),
    categorySlugs: categoryRows.map((row) => row.slug),
    tagSlugs: tagRows.map((row) => row.slug),
    authorSlugs: authorRows.map((row) => slugify(row.name)),
  };
}

export async function adminMetrics() {
  ensureDbInitialized();
  const published = db.select({ count: sql<number>`count(*)` }).from(articles).where(eq(articles.status, "published")).get();
  const drafts = db.select({ count: sql<number>`count(*)` }).from(articles).where(eq(articles.status, "draft")).get();
  const cats = db.select({ count: sql<number>`count(*)` }).from(categories).get();

  return [
    { label: "Published", value: String(published?.count ?? 0), tone: "success" as const },
    { label: "Drafts", value: String(drafts?.count ?? 0), tone: "warn" as const },
    { label: "Categories", value: String(cats?.count ?? 0), tone: "default" as const },
    {
      label: "Alert Index",
      value: (published?.count ?? 0) > 20 ? "HIGH" : "NORMAL",
      tone: (published?.count ?? 0) > 20 ? ("critical" as const) : ("default" as const),
    },
  ];
}
