import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdSlot } from "@/components/site/ad-slot";
import { ArticleCard } from "@/components/site/article-card";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildArticleJsonLd } from "@/lib/seo/json-ld";
import { db } from "@/lib/db/client";
import { articleTags, articles } from "@/lib/db/schema";
import { getArticleBySlug, getRelatedArticles } from "@/lib/content/queries";
import { eq } from "drizzle-orm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article" };

  return buildMetadata({
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    pathname: `/article/${article.slug}`,
    type: "article",
  });
}

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ad?: string }>;
}) {
  const { slug } = await params;
  const adState = (await searchParams).ad;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const articleRow = db.select().from(articles).where(eq(articles.id, article.id)).limit(1).get();
  const tagLinks = db.select().from(articleTags).where(eq(articleTags.articleId, article.id)).all();
  const related = await getRelatedArticles(
    article.id,
    articleRow?.categoryId || "",
    tagLinks.map((x) => x.tagId),
  );

  const articleJsonLd = buildArticleJsonLd(article);

  return (
    <div className="iv-shell space-y-4 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <AdSlot slot="HEADER" className="h-16" />

      <article className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="iv-card space-y-4 p-5">
          <div>
            <p className="text-xs uppercase text-blue-700">Article Detail</p>
            <h1 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="mt-1 text-3xl font-bold leading-tight md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {article.categoryName} | {article.authorName}
            </p>
          </div>

          {adState === "fallback" ? (
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-3 py-4 text-sm font-semibold text-amber-900">
              Ad unavailable. Showing contextual house recommendation.
            </div>
          ) : (
            <AdSlot slot="IN_ARTICLE" className="h-20" />
          )}
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
          <AdSlot slot="END_OF_ARTICLE" className="h-20" />
        </div>

        <aside className="space-y-4">
          <AdSlot slot="SIDEBAR" className="h-36" />
          <div className="iv-card p-4">
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-lg font-semibold">
              Related Posts
            </h2>
            <div className="mt-3 space-y-3">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          </div>
        </aside>
      </article>
    </div>
  );
}
