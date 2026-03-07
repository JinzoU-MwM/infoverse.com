export type RouteAlias = {
  source: string;
  destination: string;
};

export const ROUTE_ALIASES: RouteAlias[] = [
  { source: "/home", destination: "/" },
  { source: "/about-us", destination: "/about" },
  { source: "/contact-us", destination: "/contact" },
  { source: "/search-results", destination: "/search" },
  { source: "/newsletter-landing", destination: "/newsletter" },
  { source: "/podcast-video-hub", destination: "/media" },
  { source: "/podcast", destination: "/media" },
  { source: "/video-hub", destination: "/media" },
  { source: "/admin-login", destination: "/admin/login" },
  { source: "/admin-dashboard", destination: "/admin" },
  { source: "/admin-article-editor", destination: "/admin/articles/new" },
  { source: "/author-profile/:slug", destination: "/author/:slug" },
  { source: "/article-detail/:slug", destination: "/article/:slug" },
  { source: "/tag-topic/:slug", destination: "/tag/:slug" },
];

export function getAliasRedirects() {
  return ROUTE_ALIASES.map((alias) => ({ ...alias, permanent: true as const }));
}

export const NOT_FOUND_CANONICAL_LINKS = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/search" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Newsletter", href: "/newsletter" },
];

export const NOT_FOUND_ALIAS_LINKS = [
  { label: "Home alias", href: "/home" },
  { label: "Search alias", href: "/search-results" },
  { label: "About alias", href: "/about-us" },
  { label: "Contact alias", href: "/contact-us" },
  { label: "Media alias", href: "/podcast-video-hub" },
  { label: "Admin alias", href: "/admin-dashboard" },
];
