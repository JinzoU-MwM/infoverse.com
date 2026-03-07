import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { ArticleCard } from "@/components/site/article-card";
import { buildMetadata } from "@/lib/seo/metadata";
import { listArticlesByTag } from "@/lib/content/queries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata({
    title: `Tag #${slug}`,
    description: `Cross-category tag feed for ${slug}.`,
    pathname: `/tag/${slug}`,
  });
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tag, articles } = await listArticlesByTag(slug);
  if (!tag) notFound();

  return (
    <div className="iv-shell space-y-4 py-4">
      <Hero
        eyebrow="TAG TOPIC"
        title={`Topic Tag: #${tag.name}`}
        description="Cross-category tag feed that groups trend narratives, explainers, and brief updates."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
