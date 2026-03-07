import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="iv-admin-bg min-h-screen py-4">
      <div className="iv-shell grid gap-3 md:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl bg-slate-950 p-4 text-slate-200">
          <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-bold">
            InfoVerse
          </h2>
          <p className="mb-3 text-xs text-slate-400">Admin Shell</p>
          <nav className="space-y-2 text-sm">
            <Link className="block rounded-md bg-blue-600 px-3 py-2" href="/admin">
              Dashboard
            </Link>
            <Link className="block rounded-md bg-slate-800 px-3 py-2" href="/admin/articles/new">
              New Article
            </Link>
          </nav>
          <form action={logoutAction} className="mt-3">
            <Button variant="outline" className="w-full" type="submit">
              Sign out
            </Button>
          </form>
        </aside>

        <section className="space-y-3">
          <header className="iv-card p-4">
            <h1 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-2xl font-bold text-slate-900">
              {title}
            </h1>
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
