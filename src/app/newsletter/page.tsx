import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { buildMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = buildMetadata({
  title: "Newsletter",
  description: "Weekly intelligence brief from InfoVerse.",
  pathname: "/newsletter",
});

export default function NewsletterPage() {
  return (
    <div className="iv-shell space-y-4 py-4">
      <Hero
        eyebrow="NEWSLETTER"
        title="Weekly Intelligence Brief"
        description="Get signal-rich updates on markets, innovation, and policy shifts every week."
      />
      <section className="iv-card space-y-3 p-5">
        <p className="text-sm text-slate-600">Subscription-focused page with value proof, latest editions, and trust copy modules.</p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input type="email" placeholder="Enter your email" />
          <Button type="button">Subscribe</Button>
        </div>
      </section>
    </div>
  );
}
