import { sqliteClient } from "@/lib/db/client";

let initialized = false;

function hasColumn(table: string, column: string) {
  const rows = sqliteClient.prepare(`PRAGMA table_info(${table});`).all() as Array<{ name: string }>;
  return rows.some((row) => row.name === column);
}

function ensureColumn(table: string, column: string, definition: string) {
  if (hasColumn(table, column)) return;
  sqliteClient.exec(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
}

export function ensureDbInitialized() {
  if (initialized) return;

  sqliteClient.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      password TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content_html TEXT NOT NULL,
      content_json TEXT,
      suggestion_state_json TEXT,
      seo_title TEXT,
      seo_description TEXT,
      featured_image_path TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      category_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      published_at INTEGER,
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS article_tags (
      article_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (article_id, tag_id),
      FOREIGN KEY(article_id) REFERENCES articles(id),
      FOREIGN KEY(tag_id) REFERENCES tags(id)
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      uploaded_by TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(uploaded_by) REFERENCES users(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_account_uq ON accounts(provider_id, account_id);
    CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_uq ON sessions(token);
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS verifications_identifier_uq ON verifications(identifier);
  `);

  ensureColumn("users", "email_verified", "email_verified INTEGER NOT NULL DEFAULT 0");
  ensureColumn("users", "image", "image TEXT");
  ensureColumn("users", "updated_at", "updated_at INTEGER NOT NULL DEFAULT 0");
  ensureColumn("articles", "content_json", "content_json TEXT");
  ensureColumn("articles", "suggestion_state_json", "suggestion_state_json TEXT");
  sqliteClient.exec(`
    UPDATE users
    SET updated_at = created_at
    WHERE updated_at = 0;
  `);

  initialized = true;
}
