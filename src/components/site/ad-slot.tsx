import { AD_SLOTS } from "@/lib/constants";
import { shouldShowAdPlaceholderLabel } from "@/lib/ads";

type AdSlotKey = keyof typeof AD_SLOTS;

export function AdSlot({
  slot,
  className = "",
  editorPreview = false,
}: {
  slot: AdSlotKey;
  className?: string;
  editorPreview?: boolean;
}) {
  const showLabel = shouldShowAdPlaceholderLabel(editorPreview);

  return (
    <div
      className={`iv-ad-slot ${showLabel ? "iv-ad-slot-debug" : "iv-ad-slot-clean"} ${className}`.trim()}
      aria-label={`${AD_SLOTS[slot]} ad slot`}
      data-slot={slot}
      data-debug={showLabel ? "true" : "false"}
    >
      {showLabel ? `${AD_SLOTS[slot]} Ad Placeholder` : null}
    </div>
  );
}
