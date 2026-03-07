"use server";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { ensureDbInitialized } from "@/lib/db/init";
import { articleTags, articles, categories, tags } from "@/lib/db/schema";
import {
  requireAdminSession,
  requireOwnerSession,
  signInWithPassword,
  signOutSession,
} from "@/lib/auth/session";
import { articleSchema, categorySchema, loginSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

function normalizeCsv(csv: string) {
  return Array.from(
    new Set(
      csv
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  );
}

async function syncArticleTags(articleId: string, tagCsv: string) {
  const labels = normalizeCsv(tagCsv);
  db.delete(articleTags).where(eq(articleTags.articleId, articleId)).run();

  for (const label of labels) {
    const slug = slugify(label);
    let tagRow = db.select().from(tags).where(eq(tags.slug, slug)).limit(1).get();
    if (!tagRow) {
      const id = crypto.randomUUID();
      db.insert(tags).values({ id, name: label, slug }).run();
      tagRow = { id, name: label, slug };
    }

    db.insert(articleTags).values({ articleId, tagId: tagRow.id }).run();
  }
}

function computeArticleEditorRedirect(articleId: string, state: "draft" | "published", error?: string) {
  const base = `/admin/articles/${articleId}`;
  if (error) return `${base}?error=${error}`;
  if (state === "published") return `${base}?saved=1&state=published`;
  return `${base}?saved=1&state=draft`;
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });

  if (!parsed.success) redirect("/admin/login?error=invalid");

  try {
    await signInWithPassword(parsed.data.email, parsed.data.password);
  } catch {
    redirect("/admin/login?error=invalid");
  }

  redirect("/admin");
}

export async function logoutAction() {
  await signOutSession();
  redirect("/admin/login");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdminSession();
  ensureDbInitialized();

  const parsed = categorySchema.safeParse({
    name: String(formData.get("name") || ""),
  });
  if (!parsed.success) redirect("/admin?category=error");

  const slug = slugify(parsed.data.name);
  const exists = db.select().from(categories).where(eq(categories.slug, slug)).limit(1).get();
  if (exists) redirect("/admin?category=exists");

  db.insert(categories)
    .values({
      id: crypto.randomUUID(),
      name: parsed.data.name,
      slug,
      createdAt: Date.now(),
    })
    .run();

  revalidatePath("/admin");
  revalidatePath(`/category/${slug}`);
  redirect("/admin?category=created");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdminSession();
  ensureDbInitialized();

  const categoryId = String(formData.get("categoryId") || "").trim();
  if (!categoryId) redirect("/admin?category=missing");

  const parsed = categorySchema.safeParse({
    name: String(formData.get("name") || ""),
  });
  if (!parsed.success) redirect("/admin?category=error");

  const existing = db.select().from(categories).where(eq(categories.id, categoryId)).limit(1).get();
  if (!existing) redirect("/admin?category=missing");

  const slug = slugify(parsed.data.name);
  const conflict = db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.slug, slug), sql`${categories.id} != ${categoryId}`))
    .limit(1)
    .get();

  if (conflict) redirect("/admin?category=exists");

  db.update(categories).set({ name: parsed.data.name, slug }).where(eq(categories.id, categoryId)).run();

  revalidatePath("/admin");
  revalidatePath(`/category/${existing.slug}`);
  revalidatePath(`/category/${slug}`);
  redirect("/admin?category=updated");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireOwnerSession();
  ensureDbInitialized();

  const categoryId = String(formData.get("categoryId") || "").trim();
  if (!categoryId) redirect("/admin?category=missing");

  const category = db.select().from(categories).where(eq(categories.id, categoryId)).limit(1).get();
  if (!category) redirect("/admin?category=missing");

  const usage = db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.categoryId, categoryId))
    .get();

  if ((usage?.count ?? 0) > 0) redirect("/admin?category=in-use");

  db.delete(categories).where(eq(categories.id, categoryId)).run();

  revalidatePath("/admin");
  revalidatePath(`/category/${category.slug}`);
  redirect("/admin?category=deleted");
}

export async function saveArticleAction(formData: FormData) {
  const user = await requireAdminSession();
  ensureDbInitialized();

  const payload = {
    title: String(formData.get("title") || ""),
    categoryId: String(formData.get("categoryId") || ""),
    status: String(formData.get("status") || "draft"),
    seoTitle: String(formData.get("seoTitle") || ""),
    seoDescription: String(formData.get("seoDescription") || ""),
    featuredImagePath: String(formData.get("featuredImagePath") || ""),
    tagCsv: String(formData.get("tagCsv") || ""),
    contentHtml: String(formData.get("contentHtml") || ""),
  };

  const parsed = articleSchema.safeParse(payload);

  const articleId = String(formData.get("articleId") || "").trim();
  if (!parsed.success) {
    if (articleId) redirect(computeArticleEditorRedirect(articleId, "draft", "validation"));
    redirect("/admin/articles/new?error=validation");
  }

  const category = db.select({ id: categories.id }).from(categories).where(eq(categories.id, parsed.data.categoryId)).limit(1).get();
  if (!category) {
    if (articleId) redirect(computeArticleEditorRedirect(articleId, "draft", "category"));
    redirect("/admin/articles/new?error=category");
  }

  const now = Date.now();
  const slugBase = slugify(parsed.data.title);

  let slug = slugBase;
  const slugExists = db.select({ id: articles.id }).from(articles).where(eq(articles.slug, slug)).limit(1).get();
  if (slugExists && slugExists.id !== articleId) {
    slug = `${slugBase}-${Math.floor(now / 1000)}`;
  }

  if (articleId) {
    const existingArticle = db.select().from(articles).where(eq(articles.id, articleId)).limit(1).get();
    if (!existingArticle) redirect("/admin?alert=missing-article");

    db.update(articles)
      .set({
        title: parsed.data.title,
        slug,
        contentHtml: parsed.data.contentHtml,
        seoTitle: parsed.data.seoTitle || null,
        seoDescription: parsed.data.seoDescription || null,
        featuredImagePath: parsed.data.featuredImagePath || null,
        status: parsed.data.status,
        categoryId: parsed.data.categoryId,
        updatedAt: now,
        publishedAt:
          parsed.data.status === "published"
            ? (existingArticle.publishedAt ?? now)
            : null,
      })
      .where(eq(articles.id, articleId))
      .run();

    await syncArticleTags(articleId, parsed.data.tagCsv || "");

    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/admin");
    revalidatePath(`/article/${existingArticle.slug}`);
    revalidatePath(`/article/${slug}`);
    redirect(computeArticleEditorRedirect(articleId, parsed.data.status));
  }

  const newId = crypto.randomUUID();
  db.insert(articles)
    .values({
      id: newId,
      title: parsed.data.title,
      slug,
      contentHtml: parsed.data.contentHtml,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      featuredImagePath: parsed.data.featuredImagePath || null,
      status: parsed.data.status,
      categoryId: parsed.data.categoryId,
      authorId: user.userId,
      createdAt: now,
      updatedAt: now,
      publishedAt: parsed.data.status === "published" ? now : null,
    })
    .run();

  await syncArticleTags(newId, parsed.data.tagCsv || "");

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/admin");
  revalidatePath(`/article/${slug}`);
  redirect(computeArticleEditorRedirect(newId, parsed.data.status));
}

export async function deleteArticleAction(formData: FormData) {
  await requireAdminSession();
  const articleId = String(formData.get("articleId") || "").trim();
  if (!articleId) redirect("/admin?deleted=0");

  db.delete(articleTags).where(eq(articleTags.articleId, articleId)).run();
  db.delete(articles).where(eq(articles.id, articleId)).run();

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/search");
  redirect("/admin?deleted=1");
}

export async function publishArticleAction(formData: FormData) {
  await requireAdminSession();
  const articleId = String(formData.get("articleId") || "").trim();
  if (!articleId) redirect("/admin?published=0");

  db.update(articles)
    .set({ status: "published", publishedAt: Date.now(), updatedAt: Date.now() })
    .where(and(eq(articles.id, articleId), eq(articles.status, "draft")))
    .run();

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/search");
  redirect("/admin?published=1");
}
