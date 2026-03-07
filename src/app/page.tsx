import { Hero } from "@/components/site/hero";
import { AdSlot } from "@/components/site/ad-slot";
import { ArticleCard } from "@/components/site/article-card";
import { TrendRail } from "@/components/site/trend-rail";
import { getTrendingTopicLinks, listPublishedArticles } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Home",
  description: "Global information portal focused on technology, economy, and business insights.",
  pathname: "/",
});

export default async function HomePage() {
  const articles = await listPublishedArticles(6);
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="iv-shell space-y-4 py-4">
      <AdSlot slot="HEADER" className="h-16" />

      <Hero
        eyebrow="HERO STORY"
        title={featured ? featured.title : "InfoVerse: Where Information Meets the Future"}
        description={
          featured
            ? featured.excerpt
            : "Track global technology, market, and innovation signals with newsroom-grade context and SEO-first editorial structure."
        }
      />

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {rest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        <div className="space-y-4">
          <TrendRail items={getTrendingTopicLinks()} />
          <AdSlot slot="SIDEBAR" className="h-44" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AdSlot slot="IN_FEED" className="h-24" />
        <AdSlot slot="IN_ARTICLE" className="h-24" />
        <AdSlot slot="END_OF_ARTICLE" className="h-24" />
      </div>
    </div>
  );
}
