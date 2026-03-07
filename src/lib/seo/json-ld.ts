import type { ArticleDetail } from "@/lib/types";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo/metadata";

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    slogan: SITE_TAGLINE,
    logo: absoluteUrl("/logo.svg"),
    sameAs: [],
  };
}

export function buildArticleJsonLd(article: ArticleDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      "@type": "Person",
      name: article.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    articleSection: article.categoryName,
    keywords: article.tags.map((tag) => tag.name).join(", "),
    mainEntityOfPage: absoluteUrl(`/article/${article.slug}`),
  };
}
