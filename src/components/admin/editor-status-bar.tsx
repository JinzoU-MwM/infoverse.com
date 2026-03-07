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
    unsaved: <span className="autosave-unsaved">Unsaved changes</span>,
    saving: <span className="autosave-saving">Saving...</span>,
    saved: lastSaved ? (
      <span className="autosave-saved">Saved {formatTimeAgo(lastSaved)}</span>
    ) : (
      <span className="autosave-saved">Saved</span>
    ),
    failed: <span className="autosave-error">Save failed - Retry</span>,
  };

  return (
    <div className="iv-editor-status-bar">
      <div className="flex items-center gap-4">
        <span>{wordCount.toLocaleString()} words</span>
        <span className="text-slate-300">|</span>
        <span>{charCount.toLocaleString()} chars</span>
        <span className="text-slate-300">|</span>
        <span>~{readTime} min read</span>
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
