import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";

export function absoluteUrl(pathname = "/") {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return new URL(pathname, base).toString();
}

export function buildMetadata({
  title,
  description,
  pathname,
  type = "website",
}: {
  title: string;
  description: string;
  pathname: string;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(pathname);
  const image = absoluteUrl("/og-default.png");
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
