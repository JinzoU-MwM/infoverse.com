import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  tone = "default",
  className,
  children,
}: {
  tone?: "default" | "success" | "warn";
  className?: string;
  children: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "warn"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-200 text-slate-700";

  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", toneClass, className)}>{children}</span>;
}
