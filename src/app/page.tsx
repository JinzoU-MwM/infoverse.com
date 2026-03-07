import { AdSlot } from "@/components/site/ad-slot";
import { getTrendingTopicLinks, listCategories, listPublishedArticles, listPublishedArticlesByCategory } from "@/lib/content/queries";
import { buildMetadata } from "@/lib/seo/metadata";
import type { ArticleListItem, CategorySummary } from "@/lib/types";
import { formatDate, slugify } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "Home",
  description: "Global information portal focused on technology, economy, and business insights.",
  pathname: "/",
});

const FALLBACK_STORIES: ArticleListItem[] = [
  {
    id: "fallback-1",
    slug: "future-of-global-ai-capex",
    title: "AI Capex Cycle Enters Its Infrastructure Phase",
    excerpt: "Cloud and chip spending is shifting from experimentation into durable platform investment.",
    categoryName: "Technology",
    authorName: "InfoVerse Desk",
    featuredImagePath: null,
    publishedAt: "2026-03-08T00:00:00.000Z",
    status: "published",
  },
  {
    id: "fallback-2",
    slug: "inflation-reset-q2-briefing",
    title: "Inflation Reset: What Matters in Q2",
    excerpt: "A practical read on sticky categories and the policy signals shaping market expectations.",
    categoryName: "Economy",
    authorName: "Maya Chen",
    featuredImagePath: null,
    publishedAt: "2026-03-07T00:00:00.000Z",
    status: "published",
  },
  {
    id: "fallback-3",
    slug: "supply-chain-fragmentation-playbook",
    title: "Supply-Chain Fragmentation Is Becoming a Strategy",
    excerpt: "Export rules and energy pricing are rewriting sourcing decisions across sectors.",
    categoryName: "Business",
    authorName: "Elias Ward",
    featuredImagePath: null,
    publishedAt: "2026-03-06T00:00:00.000Z",
    status: "published",
  },
  {
    id: "fallback-4",
    slug: "energy-transition-capital-map",
    title: "Energy Transition Capital Map: Who Is Deploying, Where",
    excerpt: "The latest investment flows suggest a regional reshuffling of transition winners.",
    categoryName: "Economy",
    authorName: "Nina Alvarez",
    featuredImagePath: null,
    publishedAt: "2026-03-05T00:00:00.000Z",
    status: "published",
  },
  {
    id: "fallback-5",
    slug: "semiconductor-policy-watch",
    title: "Semiconductor Policy Watch Across Three Regions",
    excerpt: "How grant conditions and export controls are changing fab and packaging plans.",
    categoryName: "Technology",
    authorName: "Liam Foster",
    featuredImagePath: null,
    publishedAt: "2026-03-04T00:00:00.000Z",
    status: "published",
  },
  {
    id: "fallback-6",
    slug: "next-wave-consumer-software",
    title: "The Next Wave of Consumer Software Moats",
    excerpt: "Retention and distribution are beating raw feature velocity in the latest cohort.",
    categoryName: "Business",
    authorName: "Ariana Cole",
    featuredImagePath: null,
    publishedAt: "2026-03-03T00:00:00.000Z",
    status: "published",
  },
  {
    id: "fallback-7",
    slug: "credit-spreads-late-cycle-signals",
    title: "Credit Spread Drift and Late-Cycle Positioning",
    excerpt: "Portfolio teams are recalibrating around carry risk and liquidity pockets.",
    categoryName: "Economy",
    authorName: "Maya Chen",
    featuredImagePath: null,
    publishedAt: "2026-03-02T00:00:00.000Z",
    status: "published",
  },
  {
    id: "fallback-8",
    slug: "enterprise-ai-governance-turning-point",
    title: "Enterprise AI Governance Reaches a Turning Point",
    excerpt: "Boards are now demanding deployment controls tied directly to measurable outcomes.",
    categoryName: "Technology",
    authorName: "InfoVerse Desk",
    featuredImagePath: null,
    publishedAt: "2026-03-01T00:00:00.000Z",
    status: "published",
  },
  {
    id: "fallback-9",
    slug: "retail-repricing-playbook",
    title: "Retail Repricing Playbook for Cost-Volatile Markets",
    excerpt: "Operators are balancing frequency, basket stability, and premium tier protection.",
    categoryName: "Business",
    authorName: "Elias Ward",
    featuredImagePath: null,
    publishedAt: "2026-02-28T00:00:00.000Z",
    status: "published",
  },
  {
    id: "fallback-10",
    slug: "frontier-markets-digital-infrastructure",
    title: "Frontier Market Infrastructure Is Quietly Accelerating",
    excerpt: "Data centers, cables, and digital payments are creating new regional leverage.",
    categoryName: "World",
    authorName: "Nina Alvarez",
    featuredImagePath: null,
    publishedAt: "2026-02-27T00:00:00.000Z",
    status: "published",
  },
];

const QUICK_BRIEFS = [
  "VC deployment rate ticks up for vertical AI tools in regulated industries.",
  "Shipping indexes stabilize while short-haul inland rates continue to climb.",
  "Sovereign digital policy updates trigger compliance rebuild for ad-tech firms.",
  "Consumer hardware cycles extend as replacement windows move beyond 36 months.",
];

function pickHomeCategories(categories: CategorySummary[]) {
  const preferred = ["technology", "economy", "business"];
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const ordered = preferred.map((slug) => bySlug.get(slug)).filter((category): category is CategorySummary => Boolean(category));

  for (const category of categories) {
    if (ordered.length >= 3) break;
    if (!ordered.some((entry) => entry.id === category.id)) {
      ordered.push(category);
    }
  }

  return ordered.slice(0, 3);
}

export default async function HomePage() {
  const [publishedArticles, categories] = await Promise.all([listPublishedArticles(18), listCategories()]);
  const stories = publishedArticles.length > 0 ? publishedArticles : FALLBACK_STORIES;
  const featured = stories[0];
  const topStories = stories.slice(1, 7);
  const analysisStory = stories[7] ?? stories[1] ?? featured;
  const mediaStories = stories.slice(8, 10);
  const trends = getTrendingTopicLinks();
  const spotlightAuthor = stories[2]?.authorName ?? stories[0]?.authorName ?? "InfoVerse Desk";

  const preferredCategories = pickHomeCategories(categories);
  const selectedCategories =
    preferredCategories.length > 0
      ? preferredCategories
      : [
          { id: "fallback-tech", name: "Technology", slug: "technology" },
          { id: "fallback-economy", name: "Economy", slug: "economy" },
          { id: "fallback-business", name: "Business", slug: "business" },
        ];
  const categoryRails = await Promise.all(
    selectedCategories.map(async (category) => {
      const railStories = await listPublishedArticlesByCategory(category.slug);
      return {
        category,
        stories: (railStories.length > 0 ? railStories : stories.filter((story) => story.categoryName === category.name)).slice(0, 3),
      };
    })
  );
  const normalizedCategoryRails = categoryRails.map((rail) => ({
    ...rail,
    stories: rail.stories.length > 0 ? rail.stories : stories.slice(0, 3),
  }));

  return (
    <div className="pb-12">
      <div className="iv-shell space-y-7 py-7 md:space-y-10">
        <AdSlot slot="HEADER" className="h-16 md:h-20" />

        <section className="grid gap-4 rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#16284f] to-[#1a73e8] p-5 text-white md:grid-cols-[1.45fr_1fr] md:p-8">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-cyan-300/25 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-cyan-100">
              GLOBAL SIGNALS
            </span>
            <div className="space-y-4">
              <h1 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-3xl font-bold leading-tight md:text-5xl">
                Where Information Meets the Future
              </h1>
              <p className="max-w-2xl text-sm text-slate-100/90 md:text-base">
                InfoVerse curates technology, economy, and business shifts into strategic context so readers can decide faster with less
                noise.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/article/${featured.slug}`} className="iv-btn rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950">
                Read Primary Story
              </Link>
              <Link
                href="/newsletter"
                className="iv-btn rounded-full border border-cyan-200/70 bg-white/10 px-5 py-2 text-sm font-semibold text-cyan-100"
              >
                Join Newsletter
              </Link>
            </div>
            <div className="grid gap-2 text-xs text-cyan-100/90 md:grid-cols-3">
              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Realtime trend rails</div>
              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Analyst-backed insights</div>
              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Editorial trust protocol</div>
            </div>
          </div>

          <article className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:p-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-cyan-100">PRIMARY STORY</p>
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="mt-3 text-2xl font-semibold leading-tight">
              <Link href={`/article/${featured.slug}`}>{featured.title}</Link>
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-100/90">{featured.excerpt}</p>
            <div className="mt-5 flex items-center justify-between text-xs text-cyan-100/90">
              <span>
                {featured.categoryName} | {formatDate(featured.publishedAt)}
              </span>
              <span>{featured.authorName}</span>
            </div>
          </article>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-semibold text-slate-950 md:text-3xl">
              Top Stories
            </h2>
            <Link href="/search" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              View all
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topStories.map((story, index) => (
              <article key={story.id} className="iv-card overflow-hidden">
                <div
                  className="h-40 bg-gradient-to-br from-slate-900 via-blue-700 to-cyan-500"
                  style={{
                    backgroundImage: story.featuredImagePath ? `url(${story.featuredImagePath})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="space-y-3 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                    {story.categoryName} {index === 0 ? "| Editor pick" : ""}
                  </p>
                  <h3 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-xl font-semibold leading-tight text-slate-900">
                    <Link href={`/article/${story.slug}`}>{story.title}</Link>
                  </h3>
                  <p className="text-sm leading-6 text-slate-600">{story.excerpt}</p>
                  <div className="text-xs text-slate-500">
                    {formatDate(story.publishedAt)} | {story.authorName}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr_0.7fr]">
          <div className="iv-card p-4 md:p-5">
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-semibold text-slate-900">
              Trending Now
            </h2>
            <ul className="mt-4 space-y-2">
              {trends.map((trend) => (
                <li key={trend.href}>
                  <Link href={trend.href} className="flex rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:text-blue-700">
                    {trend.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="iv-card p-4 md:p-5">
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-semibold text-slate-900">
              Quick Briefs
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {QUICK_BRIEFS.map((brief) => (
                <li key={brief} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 leading-6">
                  {brief}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <AdSlot slot="SIDEBAR" className="hidden h-full min-h-80 lg:flex" />
            <AdSlot slot="IN_FEED" className="h-20" />
          </div>
        </section>

        <section className="space-y-5">
          <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-semibold text-slate-950 md:text-3xl">
            Category Rails
          </h2>

          <div className="space-y-4">
            {normalizedCategoryRails.map(({ category, stories: railStories }) => (
              <div key={category.id} className="iv-card p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-xl font-semibold text-slate-900">
                    {category.name}
                  </h3>
                  <Link href={`/category/${category.slug}`} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                    Explore
                  </Link>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {railStories.map((story) => (
                    <article key={story.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">{formatDate(story.publishedAt)}</div>
                      <h4
                        style={{ fontFamily: "var(--font-poppins), sans-serif" }}
                        className="mt-2 text-base font-semibold leading-snug text-slate-900"
                      >
                        <Link href={`/article/${story.slug}`}>{story.title}</Link>
                      </h4>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">{story.excerpt}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl bg-[#0f172a] p-5 text-white md:grid-cols-[1.2fr_0.8fr] md:p-7">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Featured Analysis</p>
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-semibold leading-tight md:text-3xl">
              <Link href={`/article/${analysisStory.slug}`}>{analysisStory.title}</Link>
            </h2>
            <p className="text-sm leading-6 text-slate-200">{analysisStory.excerpt}</p>
            <Link href={`/article/${analysisStory.slug}`} className="inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
              Read analysis
            </Link>
          </div>

          <div className="space-y-3">
            <AdSlot slot="IN_ARTICLE" className="h-20 md:h-24" />
            <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-slate-200">
              Scenario matrix updates every Friday with economy, policy, and sector implications.
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-5 md:p-7">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Newsletter</p>
              <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-semibold text-slate-900 md:text-3xl">
                Signal Brief, every Friday
              </h2>
              <p className="max-w-2xl text-sm text-slate-600">
                Practical summaries and decision-ready briefs for operators, investors, and builders.
              </p>
            </div>
            <div className="space-y-2">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">Work email</div>
              <button type="button" className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                Subscribe
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="iv-card p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Media Hub</p>
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="mt-2 text-2xl font-semibold text-slate-900">
              Podcast + Video
            </h2>
            <div className="mt-4 space-y-3">
              {mediaStories.map((story) => (
                <div key={story.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <h3 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-lg font-semibold text-slate-900">
                    {story.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{story.excerpt}</p>
                </div>
              ))}
            </div>
            <Link href="/media" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
              Explore media hub
            </Link>
          </article>

          <article className="iv-card bg-[#eef5ff] p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Premium Insights</p>
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="mt-2 text-2xl font-semibold text-slate-900">
              Deeper models for members
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="rounded-xl border border-blue-100 bg-white px-3 py-2">Weekly scenario dashboards with probability ranges.</li>
              <li className="rounded-xl border border-blue-100 bg-white px-3 py-2">Market and policy watchlists with action notes.</li>
              <li className="rounded-xl border border-blue-100 bg-white px-3 py-2">Long-form strategy memos by sector and theme.</li>
            </ul>
            <Link href="/premium-insights" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
              View premium insights
            </Link>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <article className="iv-card p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Author Spotlight</p>
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="mt-2 text-2xl font-semibold text-slate-900">
              {spotlightAuthor}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              &quot;We map signal to action so readers can move from information to decisions faster.&quot;
            </p>
            <Link href={`/author/${slugify(spotlightAuthor)}`} className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
              Read author profile
            </Link>
          </article>

          <article className="iv-card p-4 md:p-5">
            <h3 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-xl font-semibold text-slate-900">
              Trust Protocol
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <span>Fact-check layer</span>
                <span className="font-semibold text-blue-700">Enabled</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <span>Source transparency</span>
                <span className="font-semibold text-blue-700">High</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <span>Editorial review cadence</span>
                <span className="font-semibold text-blue-700">Weekly</span>
              </li>
            </ul>
          </article>
        </section>

        <section className="rounded-2xl bg-[#0f172a] p-5 text-white md:p-7">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Stay Ahead</p>
              <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-semibold md:text-3xl">
                Build your weekly briefing in 10 minutes
              </h2>
              <p className="text-sm text-slate-200">Get curated stories, fast briefs, and category snapshots in one focused read.</p>
            </div>
            <Link
              href="/newsletter"
              className="inline-flex w-fit rounded-full border border-cyan-300 px-5 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-300/10"
            >
              Join Newsletter
            </Link>
          </div>
        </section>

        <AdSlot slot="END_OF_ARTICLE" className="h-16 md:h-20" />

        <div className="sticky bottom-3 z-20 md:hidden">
          <AdSlot slot="MOBILE_STICKY" className="h-14 shadow-lg shadow-blue-100/80" />
        </div>
      </div>
    </div>
  );
}
