import type { JSONContent } from "@tiptap/core";

export type UserRole = "owner" | "editor";
export type WorkflowStatus = "draft" | "review" | "approved" | "published";
export type ArticleStatus = WorkflowStatus;

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

export type ArticleContentDoc = JSONContent;

export type SuggestionItem = {
  id: string;
  summary: string;
  beforeDoc: ArticleContentDoc;
  afterDoc: ArticleContentDoc;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
};

export type SuggestionState = {
  items: SuggestionItem[];
  pendingCount: number;
};

export type AutosaveState = "idle" | "unsaved" | "saving" | "saved" | "failed";

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
};

export type SearchResultItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryName: string;
  authorName: string;
  publishedAt: string | null;
};

export type ArticleListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryName: string;
  authorName: string;
  featuredImagePath: string | null;
  publishedAt: string | null;
  status: ArticleStatus;
};

export type ArticleDetail = ArticleListItem & {
  contentHtml: string;
  contentJson: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: Array<{ id: string; slug: string; name: string }>;
};

export type AdminMetricCard = {
  label: string;
  value: string;
  tone: "default" | "warn" | "critical" | "success";
};

export type SessionUser = {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
};

export type AuthSessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AdminArticleMutationPayload = {
  articleId?: string;
  title: string;
  categoryId: string;
  contentJson: string;
  contentHtml: string;
  seoTitle?: string;
  seoDescription?: string;
  featuredImagePath?: string;
  status: ArticleStatus;
  tagCsv?: string;
  pendingSuggestions?: number;
  suggestionStateJson?: string;
};

export type AdminMutationResult = {
  ok: boolean;
  code:
    | "SAVED"
    | "PUBLISHED"
    | "DELETED"
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "NOT_FOUND"
    | "CONFLICT"
    | "IN_USE";
  message: string;
};

export type UploadErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_FORM_DATA"
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "INVALID_UPLOAD_DIR"
  | "WRITE_FAILED";

export type UploadSuccess = {
  ok: true;
  path: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
};

export type UploadError = {
  ok: false;
  code: UploadErrorCode;
  message: string;
};

export type UploadResponse = UploadSuccess | UploadError;
