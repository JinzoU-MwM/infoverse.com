import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { ArticleCard } from "@/components/site/article-card";
import { listPublishedArticles } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Podcast and Video Hub",
  description: "InfoVerse media hub for podcasts and video insights.",
  pathname: "/media",
});

export default async function MediaPage() {
  const items = await listPublishedArticles(4);
  return (
    <div className="iv-shell space-y-4 py-4">
      <Hero
        eyebrow="PODCAST & VIDEO"
        title="InfoVerse Media Hub: Podcasts and Video Insights"
        description="Episode cards, topical playlists, and cross-linking into articles for session depth."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <ArticleCard key={item.id} article={item} />
        ))}
      </div>
    </div>
  );
}
