import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { ArticleCard } from "@/components/site/article-card";
import { buildMetadata } from "@/lib/seo/metadata";
import { listArticlesByAuthor } from "@/lib/content/queries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  return buildMetadata({
    title: `${decoded.replace(/-/g, " ")} Author Profile`,
    description: "Author profile and latest stories.",
    pathname: `/author/${slug}`,
  });
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { author, articles } = await listArticlesByAuthor(slug);
  if (!author) notFound();

  return (
    <div className="iv-shell space-y-4 py-4">
      <Hero
        eyebrow="AUTHOR PROFILE"
        title={`${author.name}: Global Markets & Innovation Desk`}
        description="Author bio, recent stories, topic expertise, and audience-trusted editorial history."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
