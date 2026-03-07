import Link from "next/link";

export function TrendRail({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <aside className="iv-card p-4">
      <h2 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="mb-2 text-lg font-semibold">
        Trending Now
      </h2>
      <ul className="space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item.href}>
            <Link className="hover:text-blue-700" href={item.href}>
              • {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
