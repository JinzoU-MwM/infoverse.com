import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertTone = "default" | "success" | "error" | "warn";

const toneClassMap: Record<AlertTone, string> = {
  default: "border-slate-200 bg-white text-slate-800",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
  error: "border-red-300 bg-red-50 text-red-800",
  warn: "border-amber-300 bg-amber-50 text-amber-900",
};

export function Alert({ tone = "default", className, children }: { tone?: AlertTone; className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border px-4 py-3 text-sm", toneClassMap[tone], className)}>{children}</div>;
}
