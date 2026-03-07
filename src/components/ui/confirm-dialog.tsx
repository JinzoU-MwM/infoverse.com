"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  variant = "destructive",
  children,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  variant?: "destructive" | "outline";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);

  return (
    <>
      <Button variant={variant === "destructive" ? "destructive" : "outline"} className="px-3 py-1 text-xs" onClick={() => ref.current?.showModal()}>
        {triggerLabel}
      </Button>
      <dialog ref={ref} className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-0 backdrop:bg-black/40">
        <form method="dialog" className="space-y-4 p-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" value="cancel">
              Cancel
            </Button>
            {children}
          </div>
        </form>
      </dialog>
    </>
  );
}
