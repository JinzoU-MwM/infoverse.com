"use client";

import { useEffect, useRef, useState } from "react";
import type { SlashCommandItem } from "@/lib/editor/slash-commands";

type Props = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  clientRect?: DOMRect | null;
};

export function SlashCommandMenu({ items: initialItems, command, clientRect }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = query
    ? initialItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.keywords.some((k) => k.includes(query.toLowerCase()))
      )
    : initialItems;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          command(filteredItems[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        command({} as SlashCommandItem);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, selectedIndex, command]);

  useEffect(() => {
    if (menuRef.current && filteredItems[selectedIndex]) {
      const selectedEl = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, filteredItems]);

  if (!clientRect) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
      style={{
        left: clientRect.left,
        top: clientRect.bottom + 8,
      }}
    >
      <div className="border-b border-slate-200 p-2">
        <input
          type="text"
          placeholder="Search commands..."
          className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-slate-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {filteredItems.length === 0 ? (
          <p className="p-2 text-sm text-slate-500">No results</p>
        ) : (
          filteredItems.map((item, index) => (
            <button
              key={item.id}
              data-index={index}
              className={`flex w-full items-center gap-3 rounded px-2 py-2 text-left text-sm transition-colors ${
                index === selectedIndex ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
              onClick={() => command(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-sm font-medium">
                {item.icon}
              </span>
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function SlashCommandMenuRenderer(props: Props) {
  return <SlashCommandMenu {...props} />;
}
