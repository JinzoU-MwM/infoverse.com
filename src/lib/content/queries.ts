import { and, count, desc, eq, gte, inArray, isNotNull, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db/client";
import { ensureDbInitialized } from "@/lib/db/init";
import { activityLogs, articleTags, articles, categories, tags, users } from "@/lib/db/schema";
import type { ActivityLogEntry, ActivityType, ArticleDetail, ArticleListItem, ArticleWorkflowCard, CategorySummary, SearchResultItem, WorkflowStatus } from "@/lib/types";
import { excerptFromHtml, slugify } from "@/lib/utils";

export type DrizzleDb = typeof db;

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
    contentJson: row.article.contentJson,
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

// Activity Log Functions

export async function logActivity(
  db: DrizzleDb,
  data: {
    articleId: string;
    actorId: string;
    type: ActivityType;
    summary: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await db.insert(activityLogs).values({
    articleId: data.articleId,
    actorId: data.actorId,
    type: data.type,
    summary: data.summary,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });
}

export async function getRecentActivity(
  db: DrizzleDb,
  limit = 20
): Promise<Array<ActivityLogEntry>> {
  const rows = await db
    .select({
      id: activityLogs.id,
      articleId: activityLogs.articleId,
      articleTitle: articles.title,
      actorId: activityLogs.actorId,
      actorName: users.name,
      type: activityLogs.type,
      summary: activityLogs.summary,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .innerJoin(articles, eq(activityLogs.articleId, articles.id))
    .innerJoin(users, eq(activityLogs.actorId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    articleId: row.articleId,
    articleTitle: row.articleTitle,
    actorId: row.actorId,
    actorName: row.actorName,
    type: row.type as ActivityType,
    summary: row.summary,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    createdAt: row.createdAt.getTime(),
  }));
}

// Workflow Queries

export async function getArticlesByStatus(
  db: DrizzleDb,
  status: WorkflowStatus
): Promise<Array<ArticleWorkflowCard>> {
  const assignees = alias(users, "assignees");

  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      status: articles.status,
      categoryName: categories.name,
      authorName: users.name,
      assigneeId: articles.assigneeId,
      assigneeName: assignees.name,
      deadline: articles.deadline,
      contentJson: articles.contentJson,
      seoTitle: articles.seoTitle,
      seoDescription: articles.seoDescription,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .leftJoin(assignees, eq(articles.assigneeId, assignees.id))
    .where(eq(articles.status, status))
    .orderBy(desc(articles.updatedAt));

  return rows.map((row) => {
    const wordCount = getWordCountFromJson(row.contentJson);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status as WorkflowStatus,
      categoryName: row.categoryName,
      authorName: row.authorName,
      assigneeId: row.assigneeId,
      assigneeName: row.assigneeName,
      deadline: row.deadline?.getTime() ?? null,
      readTime: Math.max(1, Math.round(wordCount / 200)),
      progress: calculateProgress(row),
      updatedAt: row.updatedAt,
    };
  });
}

function getWordCountFromJson(json: string | null): number {
  if (!json) return 0;
  try {
    const doc = JSON.parse(json);
    const text = extractTextFromDoc(doc);
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  } catch {
    return 0;
  }
}

function extractTextFromDoc(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const typed = node as { text?: string; content?: unknown[] };
  const parts: string[] = [];
  if (typeof typed.text === "string") parts.push(typed.text);
  if (Array.isArray(typed.content)) {
    for (const child of typed.content) {
      parts.push(extractTextFromDoc(child));
    }
  }
  return parts.join(" ");
}

function calculateProgress(row: { title: string; contentJson: string | null; seoTitle: string | null; seoDescription: string | null }): number {
  let score = 0;
  const total = 4;

  if (row.title.length >= 8) score++;
  if (getWordCountFromJson(row.contentJson) >= 100) score++;
  if (row.seoTitle && row.seoTitle.length > 0) score++;
  if (row.seoDescription && row.seoDescription.length > 0) score++;

  return Math.round((score / total) * 100);
}

// Dashboard Stats

export async function getDashboardStats(db: DrizzleDb): Promise<{
  total: number;
  drafts: number;
  inReview: number;
  dueToday: number;
  publishedThisWeek: number;
}> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const startOfWeekTs = startOfWeek.getTime();

  const [totalResult] = await db.select({ count: count() }).from(articles);
  const [draftsResult] = await db.select({ count: count() }).from(articles).where(eq(articles.status, "draft"));
  const [inReviewResult] = await db.select({ count: count() }).from(articles).where(eq(articles.status, "review"));
  const [dueTodayResult] = await db
    .select({ count: count() })
    .from(articles)
    .where(and(isNotNull(articles.deadline), lte(articles.deadline, endOfToday), gte(articles.deadline, startOfWeek)));
  const [publishedThisWeekResult] = await db
    .select({ count: count() })
    .from(articles)
    .where(and(eq(articles.status, "published"), gte(articles.publishedAt, startOfWeekTs)));

  return {
    total: totalResult.count,
    drafts: draftsResult.count,
    inReview: inReviewResult.count,
    dueToday: dueTodayResult.count,
    publishedThisWeek: publishedThisWeekResult.count,
  };
}
