import Link from "next/link";
import type { Metadata } from "next";
import { searchPublishedArticles } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search articles, topics, and authors.",
  pathname: "/search",
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = ((await searchParams).q || "").trim();
  const results = await searchPublishedArticles(q);

  return (
    <div className="iv-shell space-y-4 py-4">
      <section className="iv-card space-y-3 p-4">
        <h1 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-3xl font-bold text-slate-900">
          Search Results
        </h1>
        <form className="grid gap-3 md:grid-cols-[1fr_auto]" action="/search" method="get">
          <Input defaultValue={q} name="q" placeholder="Search articles, topics, authors..." />
          <Button type="submit">Search</Button>
        </form>
      </section>

      {q ? (
        <p className="text-sm text-slate-600">
          {results.length} result(s) for <span className="font-medium">&quot;{q}&quot;</span>
        </p>
      ) : (
        <p className="text-sm text-slate-600">Enter a query to search across published content.</p>
      )}

      <div className="space-y-3">
        {results.map((item) => (
          <article key={item.id} className="iv-card p-4">
            <p className="text-xs text-slate-500">
              {item.categoryName} | {item.authorName}
            </p>
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="mt-1 text-xl font-semibold">
              <Link href={`/article/${item.slug}`}>{item.title}</Link>
            </h2>
            <p className="mt-2 text-sm text-slate-600">{item.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
