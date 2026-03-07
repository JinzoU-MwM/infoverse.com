import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ensureDbInitialized } from "@/lib/db/init";
import { articles, categories } from "@/lib/db/schema";
import { requireAdminSession } from "@/lib/auth/session";
import { articleDocSchema } from "@/lib/validation";
import { articleDocToHtml, parseArticleDoc, parseSuggestionItems } from "@/lib/editor/content";

export async function POST(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  await requireAdminSession();
  ensureDbInitialized();

  const { id } = await context.params;
  const article = db.select().from(articles).where(eq(articles.id, id)).limit(1).get();
  if (!article) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    categoryId?: string;
    seoTitle?: string;
    seoDescription?: string;
    featuredImagePath?: string;
    tagCsv?: string;
    contentJson?: string;
    suggestionStateJson?: string;
  };

  const doc = parseArticleDoc(body.contentJson || "");
  const parsedDoc = articleDocSchema.safeParse(doc);
  if (!parsedDoc.success) {
    return NextResponse.json({ ok: false, code: "INVALID_DOC" }, { status: 400 });
  }

  const categoryId = body.categoryId?.trim() || article.categoryId;
  const validCategory = db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1)
    .get();
  if (!validCategory) {
    return NextResponse.json({ ok: false, code: "INVALID_CATEGORY" }, { status: 400 });
  }

  const suggestions = parseSuggestionItems(body.suggestionStateJson || article.suggestionStateJson || "");
  const now = Date.now();

  db.update(articles)
    .set({
      title: body.title?.trim() || article.title,
      categoryId,
      seoTitle: body.seoTitle?.trim() || null,
      seoDescription: body.seoDescription?.trim() || null,
      featuredImagePath: body.featuredImagePath?.trim() || null,
      contentJson: JSON.stringify(parsedDoc.data),
      contentHtml: articleDocToHtml(parsedDoc.data),
      suggestionStateJson: JSON.stringify(suggestions),
      updatedAt: now,
    })
    .where(eq(articles.id, id))
    .run();

  return NextResponse.json({
    ok: true,
    savedAt: now,
  });
}
