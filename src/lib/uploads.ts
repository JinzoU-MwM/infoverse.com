import path from "node:path";

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function extensionForMimeType(mimeType: string) {
  return MIME_TO_EXTENSION[mimeType] || null;
}

export function resolveUploadDirectory(projectRoot: string, configuredUploadDir?: string) {
  const configured = (configuredUploadDir || "public/uploads").trim();
  const normalized = configured.replace(/^[/\\]+/, "");

  const publicRoot = path.resolve(projectRoot, "public");
  const absoluteUploadDir = path.resolve(projectRoot, normalized || "public/uploads");

  if (!absoluteUploadDir.startsWith(publicRoot)) {
    return null;
  }

  return {
    publicRoot,
    absoluteUploadDir,
  };
}

export function buildUploadFileName(extension: string, now = Date.now()) {
  return `${now}-${crypto.randomUUID()}.${extension}`;
}

export function toPublicRelativePath(publicRoot: string, absolutePath: string) {
  return `/${path.relative(publicRoot, absolutePath).replace(/\\/g, "/")}`;
}
