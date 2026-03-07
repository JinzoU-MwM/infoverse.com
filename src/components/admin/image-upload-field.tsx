"use client";

import Image from "next/image";
import { useState } from "react";
import type { UploadResponse } from "@/lib/types";
import { Input } from "@/components/ui/input";

export function ImageUploadField({ initialPath = "" }: { initialPath?: string }) {
  const [path, setPath] = useState(initialPath);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function onUpload(file: File) {
    setBusy(true);
    setStatus("Uploading...");

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });

    const data = (await res.json()) as UploadResponse;
    setBusy(false);

    if (!res.ok || !data.ok) {
      setStatus(data.ok ? "Upload failed" : data.message);
      return;
    }

    setPath(data.path);
    setStatus("Upload complete");
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs text-slate-600">Featured image upload</label>
      <Input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onUpload(f);
        }}
        disabled={busy}
      />
      <Input
        name="featuredImagePath"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="/uploads/your-image.jpg"
      />
      {status ? <p className="text-xs text-slate-500">{status}</p> : null}
      {path ? (
        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-slate-200">
          <Image src={path} alt="Featured image preview" fill sizes="320px" className="object-cover" />
        </div>
      ) : null}
    </div>
  );
}
