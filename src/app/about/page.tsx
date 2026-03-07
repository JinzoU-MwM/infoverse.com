import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildOrganizationJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: "Learn our mission, editorial principles, and publishing standards.",
  pathname: "/about",
});

export default function AboutPage() {
  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <div className="iv-shell space-y-4 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <Hero
        eyebrow="ABOUT INFOVERSE"
        title="An Independent Global Information Platform"
        description="InfoVerse is built to deliver high-quality analysis across technology, economy, and business while keeping trust and readability first."
      />
      <section className="iv-card grid gap-4 p-5 md:grid-cols-3">
        <article>
          <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-lg font-semibold">
            Editorial Integrity
          </h2>
          <p className="mt-2 text-sm text-slate-600">Every story is reviewed for factual grounding and clear sourcing before publication.</p>
        </article>
        <article>
          <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-lg font-semibold">
            SEO by Design
          </h2>
          <p className="mt-2 text-sm text-slate-600">Structured metadata, semantic markup, and fast pages ensure discoverability.</p>
        </article>
        <article>
          <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-lg font-semibold">
            Transparent Monetization
          </h2>
          <p className="mt-2 text-sm text-slate-600">Ad slots are clearly separated from editorial decisions and recommendation logic.</p>
        </article>
      </section>
    </div>
  );
}
