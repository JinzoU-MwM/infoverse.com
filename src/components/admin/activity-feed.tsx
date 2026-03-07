"use client";

import Link from "next/link";
import type { ActivityLogEntry } from "@/lib/types";

type Props = {
  activities: ActivityLogEntry[];
};

const activityIcons: Record<string, string> = {
  created: "📝",
  edited: "✏️",
  submitted: "👁️",
  approved: "✅",
  published: "🚀",
  deleted: "🗑️",
  assigned: "👤",
  commented: "💬",
  scheduled: "📅",
};

export function ActivityFeed({ activities }: Props) {
  const grouped = groupByTime(activities);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-3">
        <h3 className="font-semibold text-slate-900">Activity</h3>
        <Link href="/admin/activity" className="text-sm text-blue-600 hover:underline">
          View all →
        </Link>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <div className="sticky top-0 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group}
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="p-4 text-center text-sm text-slate-500">No recent activity</p>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: ActivityLogEntry }) {
  return (
    <Link
      href={`/admin/editor/${activity.articleId}`}
      className="flex items-start gap-3 p-3 transition-colors hover:bg-slate-50"
    >
      <span className="text-lg">{activityIcons[activity.type] || "•"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">
          <span className="font-medium">@{activity.actorName}</span>{" "}
          <span>{getActivityVerb(activity.type)}</span>{" "}
          <span className="font-medium text-slate-900">"{truncate(activity.articleTitle, 30)}"</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{formatTimeAgo(activity.createdAt)}</p>
      </div>
    </Link>
  );
}

function groupByTime(activities: ActivityLogEntry[]): Record<string, ActivityLogEntry[]> {
  const groups: Record<string, ActivityLogEntry[]> = {};
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  for (const activity of activities) {
    let group: string;
    const time = activity.createdAt;

    if (time > now - 3600000) {
      group = "Now";
    } else if (time > today.getTime()) {
      group = "Today";
    } else if (time > yesterday.getTime()) {
      group = "Yesterday";
    } else if (time > thisWeek.getTime()) {
      group = "This Week";
    } else {
      group = "Earlier";
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(activity);
  }

  return groups;
}

function getActivityVerb(type: string): string {
  const verbs: Record<string, string> = {
    created: "created",
    edited: "edited",
    submitted: "submitted for review",
    approved: "approved",
    published: "published",
    deleted: "deleted",
    assigned: "was assigned to",
    commented: "commented on",
    scheduled: "scheduled",
  };
  return verbs[type] || "modified";
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}
