import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-slate-950 py-5 text-slate-200">
      <div className="iv-shell flex flex-wrap items-center justify-between gap-3 text-xs">
        <p>© {new Date().getFullYear()} InfoVerse Media</p>
        <div className="flex gap-4">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/newsletter">Newsletter</Link>
        </div>
      </div>
    </footer>
  );
}
