import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db/client";
import { accounts, sessions, users, verifications } from "@/lib/db/schema";

const FALLBACK_SECRET = "8wYk9Qv1L2mR5nT7xZ4pS0cF3bH6jN8uD1gK7rW2yV5eP9aM4tC0qL8hB3sX6nJ";

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || FALLBACK_SECRET,
  baseURL: process.env.SITE_URL || "http://localhost:3000",
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    camelCase: true,
    schema: {
      user: users,
      account: accounts,
      session: sessions,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    password: {
      hash: async (password) => bcrypt.hash(password, 10),
      verify: async ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "editor",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [nextCookies()],
});
