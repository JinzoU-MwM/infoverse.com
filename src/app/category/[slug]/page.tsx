import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { ArticleCard } from "@/components/site/article-card";
import { AdSlot } from "@/components/site/ad-slot";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoryBySlug, listPublishedArticlesByCategory } from "@/lib/content/queries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category" };
  return buildMetadata({
    title: `${category.name} Category`,
    description: `Latest ${category.name} news and analysis from InfoVerse`,
    pathname: `/category/${category.slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const articles = await listPublishedArticlesByCategory(slug);

  return (
    <div className="iv-shell space-y-4 py-4">
      <Hero
        eyebrow="CATEGORY"
        title={`${category.name}: Deep Coverage & Daily Signals`}
        description="Clustered analysis, latest headlines, and related reads for SEO-rich category exploration."
      />
      <AdSlot slot="HEADER" className="h-16" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
