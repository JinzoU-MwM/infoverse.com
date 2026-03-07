import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { contactSchema } from "@/lib/validation";
import { buildMetadata } from "@/lib/seo/metadata";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Reach newsroom, partnerships, and corrections desk.",
  pathname: "/contact",
});

async function submitContact(formData: FormData) {
  "use server";

  const parsed = contactSchema.safeParse({
    email: String(formData.get("email") || ""),
    message: String(formData.get("message") || ""),
  });

  if (!parsed.success) redirect("/contact?state=error");
  redirect("/contact?state=success");
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const state = (await searchParams).state;

  return (
    <div className="iv-shell space-y-4 py-4">
      <Hero
        eyebrow="CONTACT EDITORIAL"
        title="Contact the InfoVerse Team"
        description="Reach newsroom, partnerships, and corrections desk with structured response workflows."
      />

      {state === "error" ? (
        <Alert tone="error">Validation error: Please enter a valid email and message of at least 30 characters.</Alert>
      ) : null}

      {state === "success" ? (
        <Alert tone="success">Success: Your message has been sent. The editorial team will respond within 24 hours.</Alert>
      ) : null}

      <form action={submitContact} className="iv-card space-y-3 p-5">
        <label className="block text-sm">
          Email
          <Input name="email" type="email" className="mt-1" required />
        </label>
        <label className="block text-sm">
          Message
          <Textarea name="message" rows={8} className="mt-1" required minLength={30} />
        </label>
        <Button type="submit">Send Message</Button>
      </form>
    </div>
  );
}
