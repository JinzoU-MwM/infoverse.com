import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { ensureDbInitialized } from "@/lib/db/init";
import { mediaAssets } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import {
  buildUploadFileName,
  extensionForMimeType,
  resolveUploadDirectory,
  toPublicRelativePath,
} from "@/lib/uploads";
import type { UploadError, UploadErrorCode, UploadResponse, UploadSuccess } from "@/lib/types";

function errorResponse(code: UploadErrorCode, message: string, status: number) {
  const payload: UploadError = {
    ok: false,
    code,
    message,
  };

  return NextResponse.json<UploadResponse>(payload, { status });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return errorResponse("UNAUTHORIZED", "Authentication required.", 401);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse("INVALID_FORM_DATA", "Field 'file' is required.", 400);
  }

  const extension = extensionForMimeType(file.type);
  if (!extension) {
    return errorResponse("UNSUPPORTED_FILE_TYPE", "Only PNG, JPG, WEBP, and GIF are allowed.", 415);
  }

  const maxMb = Number(process.env.MAX_UPLOAD_MB || 5);
  if (file.size <= 0 || file.size > maxMb * 1024 * 1024) {
    return errorResponse("FILE_TOO_LARGE", `Maximum upload size is ${maxMb}MB.`, 413);
  }

  const uploadDir = resolveUploadDirectory(process.cwd(), process.env.UPLOAD_DIR);
  if (!uploadDir) {
    return errorResponse("INVALID_UPLOAD_DIR", "Upload directory must be inside /public.", 500);
  }

  const safeName = buildUploadFileName(extension);
  const absolutePath = path.join(uploadDir.absoluteUploadDir, safeName);

  try {
    await fs.mkdir(uploadDir.absoluteUploadDir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, bytes);
  } catch {
    return errorResponse("WRITE_FAILED", "Failed to store uploaded file.", 500);
  }

  const relativePath = toPublicRelativePath(uploadDir.publicRoot, absolutePath);

  ensureDbInitialized();
  db.insert(mediaAssets)
    .values({
      id: crypto.randomUUID(),
      path: relativePath,
      mimeType: file.type,
      size: file.size,
      uploadedBy: user.userId,
      createdAt: Date.now(),
    })
    .run();

  const payload: UploadSuccess = {
    ok: true,
    path: relativePath,
    mimeType: file.type,
    size: file.size,
  };

  return NextResponse.json<UploadResponse>(payload);
}
