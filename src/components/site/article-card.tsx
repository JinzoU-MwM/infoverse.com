import Link from "next/link";
import type { ArticleListItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <article className="iv-card overflow-hidden">
      <div
        className="h-36 bg-gradient-to-br from-slate-900 to-blue-600"
        style={{
          backgroundImage: article.featuredImagePath ? `url(${article.featuredImagePath})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="space-y-2 p-3">
        <div className="text-xs text-slate-500">
          {article.categoryName} | {formatDate(article.publishedAt)}
        </div>
        <h3 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-lg font-semibold text-slate-900">
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="text-sm text-slate-600">{article.excerpt}</p>
      </div>
    </article>
  );
}
