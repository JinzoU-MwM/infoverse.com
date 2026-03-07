import { AD_SLOTS } from "@/lib/constants";

type AdSlotKey = keyof typeof AD_SLOTS;

export function AdSlot({ slot, className = "" }: { slot: AdSlotKey; className?: string }) {
  return <div className={`iv-ad-slot ${className}`}>{AD_SLOTS[slot]} Ad Placeholder</div>;
}
