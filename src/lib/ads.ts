const TRUTHY_VALUES = new Set(["1", "true", "yes", "on"]);

export function isAdPlaceholderDebugEnabled() {
  const raw = process.env.NEXT_PUBLIC_AD_PLACEHOLDER_DEBUG;
  if (!raw) return false;
  return TRUTHY_VALUES.has(raw.trim().toLowerCase());
}

export function shouldShowAdPlaceholderLabel(editorPreview = false) {
  return editorPreview || isAdPlaceholderDebugEnabled();
}
