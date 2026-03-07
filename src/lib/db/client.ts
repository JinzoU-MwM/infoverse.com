import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "@/lib/db/schema";

function resolveDbPath() {
  const raw = process.env.DATABASE_URL || "./data/infoverse.db";
  if (path.isAbsolute(raw)) return raw;
  return path.join(process.cwd(), raw);
}

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export const sqliteClient = sqlite;
