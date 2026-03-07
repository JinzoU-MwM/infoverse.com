import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["owner", "editor"] }).notNull().default("editor"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
}, (table) => ({
  userEmailIdx: uniqueIndex("users_email_uq").on(table.email),
}));

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
}, (table) => ({
  accountProviderIdx: uniqueIndex("accounts_provider_account_uq").on(table.providerId, table.accountId),
  accountUserIdx: index("accounts_user_id_idx").on(table.userId),
}));

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
}, (table) => ({
  sessionTokenIdx: uniqueIndex("sessions_token_uq").on(table.token),
  sessionUserIdx: index("sessions_user_id_idx").on(table.userId),
}));

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
}, (table) => ({
  verificationIdentifierIdx: uniqueIndex("verifications_identifier_uq").on(table.identifier),
}));

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch('subsec') * 1000)`),
}, (table) => ({
  categorySlugIdx: uniqueIndex("categories_slug_uq").on(table.slug),
}));

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  contentHtml: text("content_html").notNull(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  featuredImagePath: text("featured_image_path"),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  categoryId: text("category_id").notNull().references(() => categories.id),
  authorId: text("author_id").notNull().references(() => users.id),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch('subsec') * 1000)`),
  publishedAt: integer("published_at"),
}, (table) => ({
  articleSlugIdx: uniqueIndex("articles_slug_uq").on(table.slug),
}));

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
}, (table) => ({
  tagSlugIdx: uniqueIndex("tags_slug_uq").on(table.slug),
}));

export const articleTags = sqliteTable(
  "article_tags",
  {
    articleId: text("article_id").notNull().references(() => articles.id),
    tagId: text("tag_id").notNull().references(() => tags.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.articleId, table.tagId] }),
  })
);

export const mediaAssets = sqliteTable("media_assets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  path: text("path").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: text("uploaded_by").references(() => users.id),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  uploads: many(mediaAssets),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  tagLinks: many(articleTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articleLinks: many(articleTags),
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}));

export type DbUser = typeof users.$inferSelect;
export type DbCategory = typeof categories.$inferSelect;
export type DbArticle = typeof articles.$inferSelect;
