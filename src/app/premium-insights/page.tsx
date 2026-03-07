import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { ArticleCard } from "@/components/site/article-card";
import { listPublishedArticles } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Premium Insights",
  description: "Data reports and forecast briefings.",
  pathname: "/premium-insights",
});

export default async function PremiumInsightsPage() {
  const items = await listPublishedArticles(4);
  return (
    <div className="iv-shell space-y-4 py-4">
      <Hero
        eyebrow="PREMIUM INSIGHTS"
        title="Data Reports & Forecast Briefings"
        description="High-value analysis previews with subscription CTAs and authority-driven presentation."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <ArticleCard key={item.id} article={item} />
        ))}
      </div>
    </div>
  );
}
