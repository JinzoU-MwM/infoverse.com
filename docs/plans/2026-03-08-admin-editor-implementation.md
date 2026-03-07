# Admin Editor & Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform admin article editor into a modern Word-like experience and build an editorial dashboard with workflow management.

**Architecture:** Extend existing Tiptap editor with floating toolbar, slash commands, and focus mode. Add new database fields for workflow status, assignments, and activity logging. Build dashboard components for Kanban pipeline, article list, and activity feed.

**Tech Stack:** Next.js 16, Tiptap 3, React 19, Tailwind CSS 4, Drizzle ORM, SQLite

---

## Phase 1: Foundation

### Task 1: Add New Types

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add workflow and dashboard types**

Add to `src/lib/types.ts` after line 4:

```typescript
export type WorkflowStatus = "draft" | "review" | "approved" | "published";

export type ActivityType =
  | "created"
  | "edited"
  | "submitted"
  | "approved"
  | "published"
  | "deleted"
  | "assigned"
  | "commented"
  | "scheduled";

export type ActivityLogEntry = {
  id: string;
  articleId: string;
  articleTitle: string;
  actorId: string;
  actorName: string;
  type: ActivityType;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
};

export type ArticleWorkflowCard = {
  id: string;
  title: string;
  slug: string;
  status: WorkflowStatus;
  categoryName: string;
  authorName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  deadline: number | null;
  readTime: number;
  progress: number;
  updatedAt: number;
};

export type ToastTone = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  tone: ToastTone;
  message: string;
  description?: string;
  action?: { label: string; href: string };
  dismissible: boolean;
  createdAt: number;
};

export type SlashCommandItem = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  icon: string;
  action: () => void;
};
```

**Step 2: Update ArticleStatus type**

Change line 4 from:
```typescript
export type ArticleStatus = "draft" | "published";
```
to:
```typescript
export type ArticleStatus = WorkflowStatus;
```

**Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add workflow, activity, and dashboard types"
```

---

### Task 2: Extend Database Schema

**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Update articles table with new fields**

Modify the `articles` table definition (lines 78-96) to add new fields:

```typescript
export const articles = sqliteTable("articles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  contentHtml: text("content_html").notNull(),
  contentJson: text("content_json"),
  suggestionStateJson: text("suggestion_state_json"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  featuredImagePath: text("featured_image_path"),
  status: text("status", { enum: ["draft", "review", "approved", "published"] }).notNull().default("draft"),
  categoryId: text("category_id").notNull().references(() => categories.id),
  authorId: text("author_id").notNull().references(() => users.id),
  assigneeId: text("assignee_id").references(() => users.id),
  deadline: integer("deadline", { mode: "timestamp_ms" }),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch('subsec') * 1000)`),
  publishedAt: integer("published_at"),
}, (table) => ({
  articleSlugIdx: uniqueIndex("articles_slug_uq").on(table.slug),
  articleAssigneeIdx: index("articles_assignee_id_idx").on(table.assigneeId),
  articleStatusIdx: index("articles_status_idx").on(table.status),
  articleDeadlineIdx: index("articles_deadline_idx").on(table.deadline),
}));
```

**Step 2: Add activity_logs table**

Add after the `mediaAssets` table (after line 124):

```typescript
export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  articleId: text("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  actorId: text("actor_id").notNull().references(() => users.id),
  type: text("type", { enum: ["created", "edited", "submitted", "approved", "published", "deleted", "assigned", "commented", "scheduled"] }).notNull(),
  summary: text("summary").notNull(),
  metadata: text("metadata"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch('subsec') * 1000)`),
}, (table) => ({
  activityArticleIdx: index("activity_logs_article_id_idx").on(table.articleId),
  activityActorIdx: index("activity_logs_actor_id_idx").on(table.actorId),
  activityCreatedAtIdx: index("activity_logs_created_at_idx").on(table.createdAt),
}));
```

**Step 3: Add activity_logs relations**

Add after `articleTagsRelations` (after line 176):

```typescript
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  article: one(articles, {
    fields: [activityLogs.articleId],
    references: [articles.id],
  }),
  actor: one(users, {
    fields: [activityLogs.actorId],
    references: [users.id],
  }),
}));
```

**Step 4: Update articlesRelations to include assignee**

Modify `articlesRelations` (lines 151-161) to add assignee:

```typescript
export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [articles.assigneeId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  tagLinks: many(articleTags),
  activityLogs: many(activityLogs),
}));
```

**Step 5: Update usersRelations to include activityLogs**

Modify `usersRelations` (lines 126-131) to add:

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  uploads: many(mediaAssets),
  sessions: many(sessions),
  accounts: many(accounts),
  activityLogs: many(activityLogs),
}));
```

**Step 6: Add type export**

Add at end of file (after line 180):

```typescript
export type DbActivityLog = typeof activityLogs.$inferSelect;
```

**Step 7: Generate and apply migration**

Run:
```bash
npm run db:generate
npm run db:push
```
Expected: Migration generated and applied successfully

**Step 8: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat(db): add workflow fields and activity logs table"
```

---

### Task 3: Add Toast Component

**Files:**
- Create: `src/components/ui/toast.tsx`

**Step 1: Create Toast component**

Create `src/components/ui/toast.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

type ToastTone = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  tone: ToastTone;
  message: string;
  description?: string;
  action?: { label: string; href: string };
  dismissible?: boolean;
  onDismiss?: () => void;
};

const toneStyles: Record<ToastTone, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  error: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
};

const icons: Record<ToastTone, string> = {
  success: "✓",
  error: "⚠",
  warning: "⚡",
  info: "ℹ",
};

export function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (toast.tone === "success") {
      const timer = setTimeout(() => {
        setVisible(false);
        toast.onDismiss?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!visible) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all ${toneStyles[toast.tone]}`}
      role="alert"
    >
      <span className="text-lg">{icons[toast.tone]}</span>
      <div className="flex-1">
        <p className="font-medium">{toast.message}</p>
        {toast.description ? (
          <p className="mt-1 text-sm opacity-80">{toast.description}</p>
        ) : null}
        {toast.action ? (
          <a
            href={toast.action.href}
            className="mt-2 inline-block text-sm font-medium underline"
          >
            {toast.action.label} →
          </a>
        ) : null}
      </div>
      {toast.dismissible !== false ? (
        <button
          onClick={() => {
            setVisible(false);
            toast.onDismiss?.();
          }}
          className="text-lg opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

type ToastContextValue = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
};

import { createContext, useContext } from "react";

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={{ ...toast, onDismiss: () => dismissToast(toast.id) }}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToasts must be used within ToastProvider");
  }
  return context;
}
```

**Step 2: Verify component compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ui/toast.tsx
git commit -m "feat(ui): add Toast component with auto-dismiss"
```

---

### Task 4: Add Activity Logging Queries

**Files:**
- Modify: `src/lib/content/queries.ts`

**Step 1: Read existing queries file**

First, read the file to understand current structure:
```bash
head -100 src/lib/content/queries.ts
```

**Step 2: Add activity log functions**

Add at end of `src/lib/content/queries.ts`:

```typescript
// Activity Log Functions

export async function logActivity(
  db: DrizzleDb,
  data: {
    articleId: string;
    actorId: string;
    type: ActivityType;
    summary: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await db.insert(activityLogs).values({
    articleId: data.articleId,
    actorId: data.actorId,
    type: data.type,
    summary: data.summary,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });
}

export async function getRecentActivity(
  db: DrizzleDb,
  limit = 20
): Promise<Array<ActivityLogEntry>> {
  const rows = await db
    .select({
      id: activityLogs.id,
      articleId: activityLogs.articleId,
      articleTitle: articles.title,
      actorId: activityLogs.actorId,
      actorName: users.name,
      type: activityLogs.type,
      summary: activityLogs.summary,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .innerJoin(articles, eq(activityLogs.articleId, articles.id))
    .innerJoin(users, eq(activityLogs.actorId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    articleId: row.articleId,
    articleTitle: row.articleTitle,
    actorId: row.actorId,
    actorName: row.actorName,
    type: row.type as ActivityType,
    summary: row.summary,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    createdAt: row.createdAt.getTime(),
  }));
}

// Workflow Queries

export async function getArticlesByStatus(
  db: DrizzleDb,
  status: WorkflowStatus
): Promise<Array<ArticleWorkflowCard>> {
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      status: articles.status,
      categoryName: categories.name,
      authorName: users.name,
      assigneeId: articles.assigneeId,
      assigneeName: sql<string | null>`${users.name}`,
      deadline: articles.deadline,
      contentJson: articles.contentJson,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(users, eq(articles.authorId, users.id))
    .leftJoin(users, eq(articles.assigneeId, users.id))
    .where(eq(articles.status, status))
    .orderBy(desc(articles.updatedAt));

  return rows.map((row) => {
    const wordCount = getWordCountFromJson(row.contentJson);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status as WorkflowStatus,
      categoryName: row.categoryName,
      authorName: row.authorName,
      assigneeId: row.assigneeId,
      assigneeName: row.assigneeName,
      deadline: row.deadline?.getTime() ?? null,
      readTime: Math.max(1, Math.round(wordCount / 200)),
      progress: calculateProgress(row),
      updatedAt: row.updatedAt.getTime(),
    };
  });
}

function getWordCountFromJson(json: string | null): number {
  if (!json) return 0;
  try {
    const doc = JSON.parse(json);
    const text = extractTextFromDoc(doc);
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  } catch {
    return 0;
  }
}

function extractTextFromDoc(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const typed = node as { text?: string; content?: unknown[] };
  const parts: string[] = [];
  if (typeof typed.text === "string") parts.push(typed.text);
  if (Array.isArray(typed.content)) {
    for (const child of typed.content) {
      parts.push(extractTextFromDoc(child));
    }
  }
  return parts.join(" ");
}

function calculateProgress(row: { title: string; contentJson: string | null; seoTitle: string | null; seoDescription: string | null }): number {
  let score = 0;
  const total = 4;

  if (row.title.length >= 8) score++;
  if (getWordCountFromJson(row.contentJson) >= 100) score++;
  if (row.seoTitle && row.seoTitle.length > 0) score++;
  if (row.seoDescription && row.seoDescription.length > 0) score++;

  return Math.round((score / total) * 100);
}

// Dashboard Stats

export async function getDashboardStats(db: DrizzleDb): Promise<{
  total: number;
  drafts: number;
  inReview: number;
  dueToday: number;
  publishedThisWeek: number;
}> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [totalResult] = await db.select({ count: count() }).from(articles);
  const [draftsResult] = await db.select({ count: count() }).from(articles).where(eq(articles.status, "draft"));
  const [inReviewResult] = await db.select({ count: count() }).from(articles).where(eq(articles.status, "review"));
  const [dueTodayResult] = await db
    .select({ count: count() })
    .from(articles)
    .where(and(isNotNull(articles.deadline), lte(articles.deadline, endOfToday), gt(articles.deadline, startOfWeek)));
  const [publishedThisWeekResult] = await db
    .select({ count: count() })
    .from(articles)
    .where(and(eq(articles.status, "published"), gte(articles.publishedAt, startOfWeek)));

  return {
    total: totalResult.count,
    drafts: draftsResult.count,
    inReview: inReviewResult.count,
    dueToday: dueTodayResult.count,
    publishedThisWeek: publishedThisWeekResult.count,
  };
}
```

**Step 3: Add necessary imports**

Add at top of file if not present:
```typescript
import { and, count, desc, eq, gt, gte, isNotNull, lte, sql } from "drizzle-orm";
import type { ActivityLogEntry, ActivityType, ArticleWorkflowCard, WorkflowStatus } from "@/lib/types";
import { activityLogs, articles, categories, users } from "@/lib/db/schema";
import type { DrizzleDb } from "@/lib/db/client";
```

**Step 4: Verify queries compile**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/lib/content/queries.ts
git commit -m "feat(queries): add activity logging and dashboard stats queries"
```

---

## Phase 2: Editor Components

### Task 5: Create Floating Toolbar Component

**Files:**
- Create: `src/components/admin/floating-toolbar.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";

type Props = {
  editor: Editor;
};

type ToolbarButton = {
  id: string;
  label: string;
  title: string;
  isActive: () => boolean;
  onClick: () => void;
};

export function FloatingToolbar({ editor }: Props) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateToolbar = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setVisible(false);
        return;
      }

      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const centerX = (start.left + end.left) / 2;

      const toolbarWidth = toolbarRef.current?.offsetWidth || 300;
      const left = Math.max(10, Math.min(centerX - toolbarWidth / 2, window.innerWidth - toolbarWidth - 10));
      const top = start.top - 48 - 8;

      if (top < 10) {
        setVisible(false);
        return;
      }

      setPosition({ top, left });
      setVisible(true);
    };

    editor.on("selectionUpdate", updateToolbar);
    editor.on("transaction", updateToolbar);

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("transaction", updateToolbar);
    };
  }, [editor]);

  const buttons: ToolbarButton[] = [
    {
      id: "bold",
      label: "B",
      title: "Bold (Ctrl+B)",
      isActive: () => editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      id: "italic",
      label: "I",
      title: "Italic (Ctrl+I)",
      isActive: () => editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      id: "underline",
      label: "U",
      title: "Underline (Ctrl+U)",
      isActive: () => editor.isActive("underline"),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      id: "strike",
      label: "S",
      title: "Strikethrough",
      isActive: () => editor.isActive("strike"),
      onClick: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      id: "h1",
      label: "H1",
      title: "Heading 1",
      isActive: () => editor.isActive("heading", { level: 1 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      id: "h2",
      label: "H2",
      title: "Heading 2",
      isActive: () => editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: "quote",
      label: '"',
      title: "Blockquote",
      isActive: () => editor.isActive("blockquote"),
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      id: "link",
      label: "🔗",
      title: "Add link",
      isActive: () => editor.isActive("link"),
      onClick: () => {
        const url = window.prompt("Enter URL:", "https://");
        if (url) {
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }
      },
    },
  ];

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {buttons.map((btn) => (
        <Button
          key={btn.id}
          type="button"
          variant={btn.isActive() ? "secondary" : "ghost"}
          className="h-8 w-8 p-0 text-sm font-semibold"
          title={btn.title}
          onClick={btn.onClick}
        >
          {btn.label}
        </Button>
      ))}
    </div>
  );
}
```

**Step 2: Verify component compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/admin/floating-toolbar.tsx
git commit -m "feat(editor): add floating toolbar component"
```

---

### Task 6: Create Slash Command Extension

**Files:**
- Create: `src/lib/editor/slash-commands.ts`

**Step 1: Install required dependency**

Run: `npm install @tiptap/suggestion @floating-ui/dom`

**Step 2: Create slash commands extension**

```typescript
import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import type { SuggestionOptions } from "@tiptap/suggestion";

export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: new PluginKey("slashCommands"),
        command: ({ editor, range, props }) => {
          props.action({ editor, range });
        },
      } as SuggestionOptions,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export type SlashCommandAction = (props: { editor: unknown; range: { from: number; to: number } }) => void;

export type SlashCommandItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  keywords: string[];
  action: SlashCommandAction;
};

export function getSlashCommandItems(editor: unknown): SlashCommandItem[] {
  return [
    {
      id: "paragraph",
      title: "Text",
      description: "Just start writing with plain text.",
      icon: "📝",
      keywords: ["text", "paragraph", "p"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { setParagraph: () => { run: () => void } } } }).chain().focus().setParagraph().run();
      },
    },
    {
      id: "heading1",
      title: "Heading 1",
      description: "Big section heading.",
      icon: "H1",
      keywords: ["h1", "heading", "title"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleHeading: (opts: { level: number }) => { run: () => void } } } }).chain().focus().toggleHeading({ level: 1 }).run();
      },
    },
    {
      id: "heading2",
      title: "Heading 2",
      description: "Medium section heading.",
      icon: "H2",
      keywords: ["h2", "heading", "subtitle"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleHeading: (opts: { level: number }) => { run: () => void } } } }).chain().focus().toggleHeading({ level: 2 }).run();
      },
    },
    {
      id: "heading3",
      title: "Heading 3",
      description: "Small section heading.",
      icon: "H3",
      keywords: ["h3", "heading"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleHeading: (opts: { level: number }) => { run: () => void } } } }).chain().focus().toggleHeading({ level: 3 }).run();
      },
    },
    {
      id: "bulletList",
      title: "Bullet List",
      description: "Create a simple bullet list.",
      icon: "•",
      keywords: ["bullet", "list", "ul"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleBulletList: () => { run: () => void } } } }).chain().focus().toggleBulletList().run();
      },
    },
    {
      id: "numberedList",
      title: "Numbered List",
      description: "Create a list with numbering.",
      icon: "1.",
      keywords: ["numbered", "list", "ol"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleOrderedList: () => { run: () => void } } } }).chain().focus().toggleOrderedList().run();
      },
    },
    {
      id: "quote",
      title: "Quote",
      description: "Capture a quote.",
      icon: '"',
      keywords: ["quote", "blockquote"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleBlockquote: () => { run: () => void } } } }).chain().focus().toggleBlockquote().run();
      },
    },
    {
      id: "code",
      title: "Code Block",
      description: "Capture a code snippet.",
      icon: "</>",
      keywords: ["code", "codeblock"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { toggleCodeBlock: () => { run: () => void } } } }).chain().focus().toggleCodeBlock().run();
      },
    },
    {
      id: "divider",
      title: "Divider",
      description: "Visually divide blocks.",
      icon: "—",
      keywords: ["divider", "hr", "separator"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { setHorizontalRule: () => { run: () => void } } } }).chain().focus().setHorizontalRule().run();
      },
    },
    {
      id: "table",
      title: "Table",
      description: "Insert a 3x3 table.",
      icon: "▦",
      keywords: ["table", "grid"],
      action: ({ editor: e }) => {
        (e as { chain: () => { focus: () => { insertTable: (opts: { rows: number; cols: number; withHeaderRow: boolean }) => { run: () => void } } } }).chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      },
    },
  ];
}
```

**Step 3: Commit**

```bash
git add src/lib/editor/slash-commands.ts package.json
git commit -m "feat(editor): add slash commands extension"
```

---

### Task 7: Create Slash Command Menu Component

**Files:**
- Create: `src/components/admin/slash-command-menu.tsx`

**Step 1: Create the menu component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { SlashCommandItem } from "@/lib/editor/slash-commands";
import { getSlashCommandItems } from "@/lib/editor/slash-commands";

type Props = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  clientRect?: DOMRect | null;
};

export function SlashCommandMenu({ items: initialItems, command, clientRect }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = query
    ? initialItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.keywords.some((k) => k.includes(query.toLowerCase()))
      )
    : initialItems;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          command(filteredItems[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        command({} as SlashCommandItem);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, selectedIndex, command]);

  if (!clientRect) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
      style={{
        left: clientRect.left,
        top: clientRect.bottom + 8,
      }}
    >
      <div className="border-b border-slate-200 p-2">
        <input
          type="text"
          placeholder="Search commands..."
          className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {filteredItems.length === 0 ? (
          <p className="p-2 text-sm text-slate-500">No results</p>
        ) : (
          filteredItems.map((item, index) => (
            <button
              key={item.id}
              className={`flex w-full items-center gap-3 rounded px-2 py-2 text-left text-sm ${
                index === selectedIndex ? "bg-slate-100" : ""
              }`}
              onClick={() => command(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-sm font-medium">
                {item.icon}
              </span>
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function SlashCommandMenuRenderer(props: Props) {
  return <SlashCommandMenu {...props} />;
}
```

**Step 2: Commit**

```bash
git add src/components/admin/slash-command-menu.tsx
git commit -m "feat(editor): add slash command menu component"
```

---

### Task 8: Add Editor Canvas Styles

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add editor canvas styles**

Add to end of `src/app/globals.css`:

```css
/* Editor Canvas Styles */
.iv-editor-canvas {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  background: #fafafa;
  border-radius: 12px;
  min-height: 60vh;
}

.iv-editor-canvas:focus-within {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

/* Enhanced Typography */
.iv-editor-canvas .ProseMirror {
  outline: none;
}

.iv-editor-canvas .ProseMirror h1 {
  font-family: var(--font-poppins), sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
  margin-top: 1.8em;
  margin-bottom: 0.8em;
}

.iv-editor-canvas .ProseMirror h2 {
  font-family: var(--font-poppins), sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  color: #1e293b;
  margin-top: 1.8em;
  margin-bottom: 0.8em;
}

.iv-editor-canvas .ProseMirror h3 {
  font-family: var(--font-poppins), sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  color: #334155;
  margin-top: 1.8em;
  margin-bottom: 0.8em;
}

.iv-editor-canvas .ProseMirror p {
  font-size: 17px;
  line-height: 1.75;
  color: #1a1a1a;
  margin-bottom: 1.5em;
}

.iv-editor-canvas .ProseMirror blockquote {
  font-size: 17px;
  font-style: italic;
  line-height: 1.7;
  color: #64748b;
  border-left: 3px solid #e2e8f0;
  padding-left: 1rem;
  margin: 1.5em 0;
}

.iv-editor-canvas .ProseMirror pre {
  font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace;
  font-size: 14px;
  font-weight: 450;
  line-height: 1.6;
  color: #0f172a;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5em 0;
  overflow-x: auto;
}

.iv-editor-canvas .ProseMirror ul,
.iv-editor-canvas .ProseMirror ol {
  padding-left: 1.5rem;
  margin-bottom: 1.5em;
}

.iv-editor-canvas .ProseMirror li {
  font-size: 17px;
  line-height: 1.75;
  color: #1a1a1a;
  margin-bottom: 0.5em;
}

.iv-editor-canvas .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #94a3b8;
  float: left;
  height: 0;
  pointer-events: none;
  font-size: 17px;
}

/* Focus Mode */
.iv-focus-mode {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(26, 26, 26, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.iv-focus-mode .iv-editor-canvas {
  background: white;
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.iv-focus-mode-close {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 101;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  color: #64748b;
  transition: all 150ms ease;
}

.iv-focus-mode-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Status Bar */
.iv-editor-status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: white;
  border-top: 1px solid #e2e8f0;
  font-size: 0.75rem;
  color: #64748b;
}

.iv-editor-status-bar .autosave-saving {
  color: #3b82f6;
}

.iv-editor-status-bar .autosave-saved {
  color: #10b981;
}

.iv-editor-status-bar .autosave-unsaved {
  color: #f59e0b;
}

.iv-editor-status-bar .autosave-error {
  color: #ef4444;
}
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(editor): add enhanced editor canvas styles"
```

---

### Task 9: Create Editor Status Bar Component

**Files:**
- Create: `src/components/admin/editor-status-bar.tsx`

**Step 1: Create the component**

```tsx
"use client";

import type { AutosaveState } from "@/lib/types";

type Props = {
  wordCount: number;
  charCount: number;
  autosaveState: AutosaveState;
  lastSaved?: Date | null;
};

export function EditorStatusBar({ wordCount, charCount, autosaveState, lastSaved }: Props) {
  const readTime = Math.max(1, Math.round(wordCount / 200));

  const autosaveDisplay = {
    idle: null,
    unsaved: <span className="autosave-unsaved">● Unsaved changes</span>,
    saving: <span className="autosave-saving">⟳ Saving...</span>,
    saved: lastSaved ? (
      <span className="autosave-saved">✓ Saved {formatTimeAgo(lastSaved)}</span>
    ) : (
      <span className="autosave-saved">✓ Saved</span>
    ),
    failed: <span className="autosave-error">⚠️ Save failed - Retry</span>,
  };

  return (
    <div className="iv-editor-status-bar">
      <div className="flex items-center gap-4">
        <span>📝 {wordCount.toLocaleString()} words</span>
        <span>·</span>
        <span>{charCount.toLocaleString()} chars</span>
        <span>·</span>
        <span>⏱️ ~{readTime} min read</span>
      </div>
      <div>{autosaveDisplay[autosaveState]}</div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 120) return "1m ago";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 7200) return "1h ago";
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return date.toLocaleDateString();
}
```

**Step 2: Commit**

```bash
git add src/components/admin/editor-status-bar.tsx
git commit -m "feat(editor): add editor status bar component"
```

---

## Phase 3: Editor Integration

### Task 10: Create New Article Editor Layout

**Files:**
- Create: `src/components/admin/modern-article-editor.tsx`

**Step 1: Create the new editor layout component**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import { saveArticleAction } from "@/app/admin/actions";
import { FloatingToolbar } from "@/components/admin/floating-toolbar";
import { EditorStatusBar } from "@/components/admin/editor-status-bar";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createEditorExtensions } from "@/lib/editor/extensions";
import type { ArticleContentDoc, AutosaveState, EditorValues } from "@/lib/types";
import { articleDocToHtml, EMPTY_ARTICLE_DOC } from "@/lib/editor/content";

type Props = {
  categories: Array<{ id: string; name: string }>;
  values: EditorValues;
  error?: string;
  saved?: string;
};

export function ModernArticleEditor({ categories, values, error, saved }: Props) {
  const [title, setTitle] = useState(values.title);
  const [seoTitle, setSeoTitle] = useState(values.seoTitle);
  const [seoDescription, setSeoDescription] = useState(values.seoDescription);
  const [tagCsv, setTagCsv] = useState(values.tagCsv);
  const [categoryId, setCategoryId] = useState(values.categoryId || categories[0]?.id || "");
  const [featuredImagePath, setFeaturedImagePath] = useState(values.featuredImagePath);
  const [contentJson, setContentJson] = useState(values.contentJson);
  const [contentHtml, setContentHtml] = useState(values.contentHtml);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  let parsedInitialDoc: ArticleContentDoc;
  try {
    parsedInitialDoc = JSON.parse(values.contentJson) as ArticleContentDoc;
  } catch {
    parsedInitialDoc = EMPTY_ARTICLE_DOC;
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createEditorExtensions(),
    content: parsedInitialDoc,
    editorProps: {
      attributes: {
        class: "iv-editor-canvas",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const json = activeEditor.getJSON() as ArticleContentDoc;
      const text = activeEditor.getText({ blockSeparator: " " }).trim();
      setContentJson(JSON.stringify(json));
      setContentHtml(articleDocToHtml(json));
      setWordCount(text ? text.split(/\s+/).length : 0);
      setCharCount(text.length);
      scheduleAutosave();
    },
  });

  const scheduleAutosave = useCallback(() => {
    if (!values.articleId) {
      setAutosaveState("unsaved");
      return;
    }

    setAutosaveState("unsaved");
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void runAutosave();
    }, 900);
  }, [values.articleId]);

  const runAutosave = useCallback(async () => {
    if (!values.articleId) return;

    setAutosaveState("saving");
    try {
      const response = await fetch(`/api/admin/articles/${values.articleId}/autosave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          seoTitle,
          seoDescription,
          tagCsv,
          categoryId,
          featuredImagePath,
          contentJson,
        }),
      });

      if (!response.ok) {
        setAutosaveState("failed");
        return;
      }

      setAutosaveState("saved");
      setLastSaved(new Date());
    } catch {
      setAutosaveState("failed");
    }
  }, [values.articleId, title, seoTitle, seoDescription, tagCsv, categoryId, featuredImagePath, contentJson]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  if (!editor) return null;

  const editorContent = (
    <>
      {editor && <FloatingToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </>
  );

  if (focusMode) {
    return (
      <div className="iv-focus-mode">
        <button
          className="iv-focus-mode-close"
          onClick={() => setFocusMode(false)}
          aria-label="Exit focus mode"
        >
          ×
        </button>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleAutosave();
            }}
            placeholder="Article title..."
            className="mb-4 w-full border-b-2 border-transparent bg-transparent pb-2 text-3xl font-bold outline-none focus:border-slate-300"
          />
          {editorContent}
        </div>
        <EditorStatusBar
          wordCount={wordCount}
          charCount={charCount}
          autosaveState={autosaveState}
          lastSaved={lastSaved}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-slate-500 hover:text-slate-700">
            ← Back
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleAutosave();
            }}
            placeholder="Article title..."
            className="text-xl font-semibold outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFocusMode(true)}>
            Focus
          </Button>
          <Button variant="outline" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "Hide" : "Show"} Sidebar
          </Button>
          <form action={saveArticleAction} className="flex gap-2">
            {values.articleId && <input type="hidden" name="articleId" value={values.articleId} />}
            <input type="hidden" name="contentHtml" value={contentHtml} />
            <input type="hidden" name="contentJson" value={contentJson} />
            <input type="hidden" name="categoryId" value={categoryId} />
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="seoTitle" value={seoTitle} />
            <input type="hidden" name="seoDescription" value={seoDescription} />
            <input type="hidden" name="tagCsv" value={tagCsv} />
            <input type="hidden" name="featuredImagePath" value={featuredImagePath} />
            <Button type="submit" name="status" value="draft" variant="outline">
              Save Draft
            </Button>
            <Button type="submit" name="status" value="published">
              Publish
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Editor */}
        <main className="flex-1 overflow-y-auto py-8">
          {editorContent}
        </main>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-4">
            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>
                <Select
                  name="categoryId"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    scheduleAutosave();
                  }}
                  className="w-full"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Featured Image */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Featured Image
                </label>
                <ImageUploadField
                  initialPath={featuredImagePath}
                  onChangePath={(path) => {
                    setFeaturedImagePath(path);
                    scheduleAutosave();
                  }}
                />
              </div>

              {/* SEO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  SEO Title
                </label>
                <Input
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    scheduleAutosave();
                  }}
                  placeholder="SEO title..."
                  maxLength={120}
                />
                <p className="mt-1 text-xs text-slate-500">{seoTitle.length}/120</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  SEO Description
                </label>
                <Input
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoDescription(e.target.value);
                    scheduleAutosave();
                  }}
                  placeholder="SEO description..."
                  maxLength={180}
                />
                <p className="mt-1 text-xs text-slate-500">{seoDescription.length}/180</p>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tags
                </label>
                <Input
                  value={tagCsv}
                  onChange={(e) => {
                    setTagCsv(e.target.value);
                    scheduleAutosave();
                  }}
                  placeholder="tag1, tag2, tag3"
                />
                <p className="mt-1 text-xs text-slate-500">Comma-separated</p>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Status Bar */}
      <EditorStatusBar
        wordCount={wordCount}
        charCount={charCount}
        autosaveState={autosaveState}
        lastSaved={lastSaved}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/admin/modern-article-editor.tsx
git commit -m "feat(editor): create modern article editor layout"
```

---

### Task 11: Update Editor Types

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add EditorValues type**

Add to `src/lib/types.ts`:

```typescript
export type EditorValues = {
  articleId?: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  tagCsv: string;
  categoryId: string;
  featuredImagePath: string;
  contentHtml: string;
  contentJson: string;
  suggestionStateJson?: string;
};
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add EditorValues type"
```

---

### Task 12: Create New Editor Pages

**Files:**
- Create: `src/app/admin/editor/new/page.tsx`
- Create: `src/app/admin/editor/[id]/page.tsx`

**Step 1: Create new article page**

Create `src/app/admin/editor/new/page.tsx`:

```tsx
import { requireAdminSession } from "@/lib/auth/session";
import { listCategories } from "@/lib/content/queries";
import { ModernArticleEditor } from "@/components/admin/modern-article-editor";
import { EMPTY_ARTICLE_DOC } from "@/lib/editor/content";

export default async function NewArticleEditorPage() {
  await requireAdminSession();
  const categories = await listCategories();

  return (
    <ModernArticleEditor
      categories={categories}
      values={{
        title: "",
        seoTitle: "",
        seoDescription: "",
        tagCsv: "",
        categoryId: categories[0]?.id || "",
        featuredImagePath: "",
        contentHtml: "<p></p>",
        contentJson: JSON.stringify(EMPTY_ARTICLE_DOC),
      }}
    />
  );
}
```

**Step 2: Create edit article page**

Create `src/app/admin/editor/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { getAdminArticleById, listCategories } from "@/lib/content/queries";
import { ModernArticleEditor } from "@/components/admin/modern-article-editor";
import { ensureArticleDocFromStorage } from "@/lib/editor/content";

export default async function EditArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;

  const [article, categories] = await Promise.all([
    getAdminArticleById(id),
    listCategories(),
  ]);

  if (!article) notFound();

  const doc = ensureArticleDocFromStorage(article.contentJson || null, article.contentHtml);

  return (
    <ModernArticleEditor
      categories={categories}
      values={{
        articleId: article.id,
        title: article.title,
        seoTitle: article.seoTitle || "",
        seoDescription: article.seoDescription || "",
        tagCsv: article.tagCsv,
        categoryId: article.categoryId,
        featuredImagePath: article.featuredImagePath || "",
        contentHtml: article.contentHtml,
        contentJson: JSON.stringify(doc),
      }}
    />
  );
}
```

**Step 3: Commit**

```bash
git add src/app/admin/editor/
git commit -m "feat(editor): add new modern editor pages"
```

---

## Phase 4: Dashboard Components

### Task 13: Create Workflow Pipeline Component

**Files:**
- Create: `src/components/admin/workflow-pipeline.tsx`

**Step 1: Create the component**

```tsx
"use client";

import Link from "next/link";
import type { ArticleWorkflowCard, WorkflowStatus } from "@/lib/types";

type Props = {
  columns: Record<WorkflowStatus, ArticleWorkflowCard[]>;
  onStatusChange?: (articleId: string, newStatus: WorkflowStatus) => void;
};

const columnConfig: Array<{ status: WorkflowStatus; label: string; icon: string; color: string }> = [
  { status: "draft", label: "Draft", icon: "📝", color: "bg-slate-100 border-slate-300" },
  { status: "review", label: "Review", icon: "👁️", color: "bg-amber-50 border-amber-300" },
  { status: "approved", label: "Approved", icon: "✅", color: "bg-emerald-50 border-emerald-300" },
  { status: "published", label: "Published", icon: "🚀", color: "bg-blue-50 border-blue-300" },
];

export function WorkflowPipeline({ columns, onStatusChange }: Props) {
  const handleDragStart = (e: React.DragEvent, articleId: string) => {
    e.dataTransfer.setData("articleId", articleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: WorkflowStatus) => {
    e.preventDefault();
    const articleId = e.dataTransfer.getData("articleId");
    if (articleId && onStatusChange) {
      onStatusChange(articleId, status);
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
        {columnConfig.map(({ status, label, icon, color }) => (
          <div
            key={status}
            className={`w-72 shrink-0 rounded-lg border-2 ${color}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-inherit p-3">
              <div className="flex items-center gap-2">
                <span>{icon}</span>
                <span className="font-semibold text-slate-700">{label}</span>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-sm font-medium text-slate-600">
                {columns[status]?.length || 0}
              </span>
            </div>

            {/* Cards */}
            <div className="max-h-96 space-y-2 overflow-y-auto p-2">
              {columns[status]?.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onDragStart={(e) => handleDragStart(e, article.id)}
                />
              ))}
              {(!columns[status] || columns[status].length === 0) && (
                <p className="p-4 text-center text-sm text-slate-500">No articles</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleCard({
  article,
  onDragStart,
}: {
  article: ArticleWorkflowCard;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const isOverdue = article.deadline && article.deadline < Date.now();

  return (
    <Link href={`/admin/editor/${article.id}`}>
      <div
        draggable
        onDragStart={onDragStart}
        className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
      >
        <h4 className="line-clamp-2 font-medium text-slate-900">{article.title}</h4>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded bg-slate-100 px-1.5 py-0.5">{article.categoryName}</span>
          <span>⏱️ {article.readTime} min</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-600">@{article.authorName}</span>
          {article.deadline && (
            <span className={`text-xs ${isOverdue ? "text-red-600" : "text-slate-500"}`}>
              {isOverdue ? "⚠️ " : ""}
              {new Date(article.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${article.progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/admin/workflow-pipeline.tsx
git commit -m "feat(dashboard): add workflow pipeline component"
```

---

### Task 14: Create Activity Feed Component

**Files:**
- Create: `src/components/admin/activity-feed.tsx`

**Step 1: Create the component**

```tsx
"use client";

import Link from "next/link";
import type { ActivityLogEntry } from "@/lib/types";

type Props = {
  activities: ActivityLogEntry[];
};

const activityIcons: Record<string, string> = {
  created: "📝",
  edited: "✏️",
  submitted: "👁️",
  approved: "✅",
  published: "🚀",
  deleted: "🗑️",
  assigned: "👤",
  commented: "💬",
  scheduled: "📅",
};

export function ActivityFeed({ activities }: Props) {
  const grouped = groupByTime(activities);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-3">
        <h3 className="font-semibold text-slate-900">Activity</h3>
        <Link href="/admin/activity" className="text-sm text-blue-600 hover:underline">
          View all →
        </Link>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <div className="sticky top-0 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group}
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <p className="p-4 text-center text-sm text-slate-500">No recent activity</p>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: ActivityLogEntry }) {
  return (
    <Link
      href={`/admin/editor/${activity.articleId}`}
      className="flex items-start gap-3 p-3 transition-colors hover:bg-slate-50"
    >
      <span className="text-lg">{activityIcons[activity.type] || "•"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">
          <span className="font-medium">@{activity.actorName}</span>{" "}
          <span>{getActivityVerb(activity.type)}</span>{" "}
          <span className="font-medium text-slate-900">"{truncate(activity.articleTitle, 30)}"</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{formatTimeAgo(activity.createdAt)}</p>
      </div>
    </Link>
  );
}

function groupByTime(activities: ActivityLogEntry[]): Record<string, ActivityLogEntry[]> {
  const groups: Record<string, ActivityLogEntry[]> = {};
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  for (const activity of activities) {
    let group: string;
    const time = activity.createdAt;

    if (time > now - 3600000) {
      group = "Now";
    } else if (time > today.getTime()) {
      group = "Today";
    } else if (time > yesterday.getTime()) {
      group = "Yesterday";
    } else if (time > thisWeek.getTime()) {
      group = "This Week";
    } else {
      group = "Earlier";
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(activity);
  }

  return groups;
}

function getActivityVerb(type: string): string {
  const verbs: Record<string, string> = {
    created: "created",
    edited: "edited",
    submitted: "submitted for review",
    approved: "approved",
    published: "published",
    deleted: "deleted",
    assigned: "was assigned to",
    commented: "commented on",
    scheduled: "scheduled",
  };
  return verbs[type] || "modified";
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}
```

**Step 2: Commit**

```bash
git add src/components/admin/activity-feed.tsx
git commit -m "feat(dashboard): add activity feed component"
```

---

### Task 15: Create Quick Stats Component

**Files:**
- Create: `src/components/admin/quick-stats.tsx`

**Step 1: Create the component**

```tsx
"use client";

type Stats = {
  total: number;
  drafts: number;
  inReview: number;
  dueToday: number;
  publishedThisWeek: number;
};

type Props = {
  stats: Stats;
};

export function QuickStats({ stats }: Props) {
  const items = [
    { label: "Total", value: stats.total, icon: "📊" },
    { label: "Drafts", value: stats.drafts, icon: "📝" },
    { label: "In Review", value: stats.inReview, icon: "👁️" },
    { label: "Due Today", value: stats.dueToday, icon: "⏰", highlight: stats.dueToday > 0 },
    { label: "Published This Week", value: stats.publishedThisWeek, icon: "✅" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
            item.highlight
              ? "border-amber-300 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <div>
            <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/admin/quick-stats.tsx
git commit -m "feat(dashboard): add quick stats component"
```

---

### Task 16: Create New Dashboard Page

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step 1: Replace dashboard with new design**

```tsx
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { WorkflowPipeline } from "@/components/admin/workflow-pipeline";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { QuickStats } from "@/components/admin/quick-stats";
import { requireAdminSession } from "@/lib/auth/session";
import {
  getArticlesByStatus,
  getRecentActivity,
  getDashboardStats,
  listCategoriesWithArticleCount,
} from "@/lib/content/queries";
import { Button } from "@/components/ui/button";
import type { WorkflowStatus } from "@/lib/types";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  const [draftArticles, reviewArticles, approvedArticles, publishedArticles, activities, stats, categories] = await Promise.all([
    getArticlesByStatus("draft"),
    getArticlesByStatus("review"),
    getArticlesByStatus("approved"),
    getArticlesByStatus("published"),
    getRecentActivity(20),
    getDashboardStats(),
    listCategoriesWithArticleCount(),
  ]);

  const columns = {
    draft: draftArticles,
    review: reviewArticles,
    approved: approvedArticles,
    published: publishedArticles,
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4">
      <div className="iv-shell space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-poppins)" }}>
              Dashboard
            </h1>
            <p className="text-sm text-slate-500">Welcome back, {session.name}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/editor/new">
              <Button>New Article</Button>
            </Link>
          </div>
        </header>

        {/* Quick Stats */}
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quick Stats
          </h2>
          <QuickStats stats={stats} />
        </section>

        {/* Workflow Pipeline */}
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Workflow Pipeline
          </h2>
          <WorkflowPipeline columns={columns} />
        </section>

        {/* Two Column Layout */}
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          {/* Category Management - simplified */}
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  {cat.name} ({cat.articleCount})
                </span>
              ))}
            </div>
          </section>

          {/* Activity Feed */}
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(dashboard): implement new dashboard design"
```

---

## Phase 5: Final Integration

### Task 17: Update Admin Shell Navigation

**Files:**
- Modify: `src/components/admin/admin-shell.tsx`

**Step 1: Update navigation links**

Update the navigation section in `src/components/admin/admin-shell.tsx`:

```tsx
<nav className="space-y-2 text-sm">
  <Link className="block rounded-md bg-slate-800 px-3 py-2 hover:bg-slate-700" href="/admin">
    Dashboard
  </Link>
  <Link className="block rounded-md bg-slate-800 px-3 py-2 hover:bg-slate-700" href="/admin/editor/new">
    New Article
  </Link>
  <Link className="block rounded-md bg-slate-800 px-3 py-2 hover:bg-slate-700" href="/admin/articles/new">
    Legacy Editor
  </Link>
</nav>
```

**Step 2: Commit**

```bash
git add src/components/admin/admin-shell.tsx
git commit -m "feat(admin): update shell navigation with new editor links"
```

---

### Task 18: Add Status Change Action

**Files:**
- Modify: `src/app/admin/actions.ts`

**Step 1: Add updateArticleStatusAction**

Add to `src/app/admin/actions.ts`:

```typescript
export async function updateArticleStatusAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  const articleId = formData.get("articleId") as string;
  const status = formData.get("status") as WorkflowStatus;

  if (!articleId || !status) {
    redirect("/admin?alert=missing");
    return;
  }

  const db = getDb();
  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  if (!article) {
    redirect("/admin?alert=notfound");
    return;
  }

  const updateData: Partial<typeof articles.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "published" && !article.publishedAt) {
    updateData.publishedAt = new Date();
  }

  await db.update(articles).set(updateData).where(eq(articles.id, articleId));

  await logActivity(db, {
    articleId,
    actorId: session.userId,
    type: status === "published" ? "published" : status === "review" ? "submitted" : "edited",
    summary: `Status changed to ${status}`,
  });

  redirect("/admin");
}
```

**Step 2: Add necessary imports**

Ensure these imports are present:
```typescript
import type { WorkflowStatus } from "@/lib/types";
import { logActivity } from "@/lib/content/queries";
```

**Step 3: Commit**

```bash
git add src/app/admin/actions.ts
git commit -m "feat(actions): add article status update action"
```

---

### Task 19: Final Verification

**Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Start dev server and verify**

Run: `npm run dev`
Open: `http://localhost:3000/admin`

Verify:
- Dashboard loads with workflow pipeline
- Activity feed shows recent activity
- Quick stats display correctly
- New article editor loads
- Focus mode works (Cmd+Shift+F)
- Floating toolbar appears on text selection
- Sidebar toggles correctly

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete admin editor and dashboard redesign

- Modern Word-like article editor with floating toolbar
- Focus mode for distraction-free writing
- Enhanced typography and canvas styling
- Kanban-style workflow pipeline
- Activity feed with real-time updates
- Quick stats dashboard widgets
- Toast notifications system
- New database schema for workflow tracking

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

This plan implements:

1. **Foundation** (Tasks 1-4)
   - New types for workflow, activity, toasts
   - Database schema extensions (assignee, deadline, status, activity_logs)
   - Toast component
   - Activity logging queries

2. **Editor Components** (Tasks 5-9)
   - Floating toolbar
   - Slash commands extension
   - Slash command menu
   - Editor canvas styles
   - Status bar

3. **Editor Integration** (Tasks 10-12)
   - Modern article editor layout
   - New editor pages
   - Focus mode

4. **Dashboard Components** (Tasks 13-16)
   - Workflow pipeline (Kanban)
   - Activity feed
   - Quick stats
   - New dashboard page

5. **Final Integration** (Tasks 17-19)
   - Navigation updates
   - Status change action
   - Verification
