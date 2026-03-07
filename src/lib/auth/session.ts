import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/better-auth";
import type { SessionUser, UserRole } from "@/lib/types";

export function coerceRole(input: unknown): UserRole {
  return input === "owner" ? "owner" : "editor";
}

async function requestHeaders() {
  return new Headers(await headers());
}

export async function signInWithPassword(email: string, password: string) {
  await auth.api.signInEmail({
    headers: await requestHeaders(),
    body: {
      email: email.toLowerCase(),
      password,
      rememberMe: true,
    },
  });
}

export async function signOutSession() {
  await auth.api.signOut({
    headers: await requestHeaders(),
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: await requestHeaders(),
  });

  if (!session?.user) return null;

  return {
    userId: String(session.user.id),
    email: String(session.user.email),
    name: String(session.user.name),
    role: coerceRole((session.user as { role?: unknown }).role),
  };
}

export async function requireAdminSession() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login?error=auth");
  return user;
}

export async function requireOwnerSession() {
  const user = await requireAdminSession();
  if (user.role !== "owner") redirect("/admin/login?error=forbidden");
  return user;
}
