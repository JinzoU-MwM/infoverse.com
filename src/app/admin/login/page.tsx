import Link from "next/link";
import { loginAction } from "@/app/admin/actions";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/admin");

  const error = (await searchParams).error;

  return (
    <div className="iv-admin-bg flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white md:grid-cols-2">
        <section className="space-y-4 bg-slate-950 p-8 text-slate-100">
          <h1 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-4xl font-bold">
            InfoVerse Admin
          </h1>
          <p className="text-sm text-slate-300">Secure publishing workspace for editors and owners.</p>
          <div className="iv-ad-slot h-40 border-cyan-500 bg-slate-900 text-cyan-300">Security Monitoring Panel Preview</div>
        </section>

        <section className="space-y-4 p-8">
          <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-3xl font-bold text-slate-900">
            Sign in
          </h2>
          <p className="text-sm text-slate-500">Owner and Editor accounts only</p>
          {error ? <Alert tone="error">Authentication failed. Check credentials and try again.</Alert> : null}
          <form action={loginAction} className="space-y-3">
            <Input type="email" name="email" placeholder="Email" required />
            <Input type="password" name="password" placeholder="Password" required minLength={8} />
            <Button className="w-full" type="submit">
              Continue to Dashboard
            </Button>
          </form>
          <p className="text-xs text-slate-500">Protected by Better Auth sessions, RBAC, and audit-ready data model.</p>
          <Link href="/" className="text-sm text-blue-700">
            Back to site
          </Link>
        </section>
      </div>
    </div>
  );
}
