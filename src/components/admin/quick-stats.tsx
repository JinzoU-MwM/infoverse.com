"use client";

type Stats = {
  total: number;
  drafts: number;
  inReview: number;
  dueToday: number;
  publishedThisWeek: number;
};

type Props = {
  stats: Stats;
};

export function QuickStats({ stats }: Props) {
  const items = [
    { label: "Total", value: stats.total, icon: "📊" },
    { label: "Drafts", value: stats.drafts, icon: "📝" },
    { label: "In Review", value: stats.inReview, icon: "👁️" },
    { label: "Due Today", value: stats.dueToday, icon: "⏰", highlight: stats.dueToday > 0 },
    { label: "Published This Week", value: stats.publishedThisWeek, icon: "✅" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
            item.highlight
              ? "border-amber-300 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <div>
            <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
