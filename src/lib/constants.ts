export const SITE_NAME = "InfoVerse";
export const SITE_TAGLINE = "Where Information Meets the Future";

export const BRAND_COLORS = {
  blue: "#1A73E8",
  navy: "#0F172A",
  cyan: "#06B6D4",
  bg: "#F8FAFC",
  text: "#111827",
  textMuted: "#6B7280",
} as const;

export const AD_SLOTS = {
  HEADER: "Header Banner",
  IN_FEED: "In-Feed Block",
  IN_ARTICLE: "In-Article Mid",
  SIDEBAR: "Sidebar Slot",
  MOBILE_STICKY: "Mobile Sticky Inline",
  END_OF_ARTICLE: "End of Article",
} as const;

export const NAV_ITEMS = [
  { label: "Technology", href: "/category/technology" },
  { label: "Economy", href: "/category/economy" },
  { label: "Business", href: "/category/business" },
  { label: "World", href: "/category/world-news" },
  { label: "Innovation", href: "/tag/innovation" },
] as const;
