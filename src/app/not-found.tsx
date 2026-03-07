import Link from "next/link";
import { NOT_FOUND_ALIAS_LINKS, NOT_FOUND_CANONICAL_LINKS } from "@/lib/routing/aliases";

export default function NotFound() {
  return (
    <div className="iv-shell py-12 md:py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-3xl font-bold text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          The content you requested does not exist or is no longer available. Use the canonical routes below, or the Paper-style aliases
          that redirect automatically.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-lg font-semibold text-slate-900">
              Canonical routes
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {NOT_FOUND_CANONICAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-blue-700">
                    {link.label} ({link.href})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-lg font-semibold text-slate-900">
              Alias entry routes
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {NOT_FOUND_ALIAS_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-blue-700">
                    {link.label} ({link.href})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
