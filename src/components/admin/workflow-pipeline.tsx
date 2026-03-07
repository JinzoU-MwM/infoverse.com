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
            <div className="flex items-center justify-between border-b border-inherit p-3">
              <div className="flex items-center gap-2">
                <span>{icon}</span>
                <span className="font-semibold text-slate-700">{label}</span>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-sm font-medium text-slate-600">
                {columns[status]?.length || 0}
              </span>
            </div>
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
