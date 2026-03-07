export type UserRole = "owner" | "editor";
export type ArticleStatus = "draft" | "published";

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
  contentHtml: string;
  seoTitle?: string;
  seoDescription?: string;
  featuredImagePath?: string;
  status: ArticleStatus;
  tagCsv?: string;
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
};

export type UploadError = {
  ok: false;
  code: UploadErrorCode;
  message: string;
};

export type UploadResponse = UploadSuccess | UploadError;
