"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 text-slate-100 backdrop-blur">
      <div className="iv-shell flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex flex-col">
          <span style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-bold">
            {SITE_NAME}
          </span>
          <span className="text-[11px] text-slate-400">{SITE_TAGLINE}</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-2 py-1",
                pathname.startsWith(item.href) ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/search" className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-300">
            Search
          </Link>
        </nav>

        <Button
          type="button"
          variant="outline"
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? "Close" : "Menu"}
        </Button>
      </div>

      {mobileOpen ? (
        <div id="mobile-nav" className="border-t border-slate-800 bg-slate-900 md:hidden">
          <div className="iv-shell flex flex-col gap-2 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm",
                  pathname.startsWith(item.href) ? "bg-blue-600 text-white" : "text-slate-200"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/search" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-200">
              Search
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
