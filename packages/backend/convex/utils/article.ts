const WORDS_PER_MINUTE = 225;

export const normalizeArticleText = (value: string | null | undefined) => {
  if (!value) return undefined;

  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized || undefined;
};

export const calculateReadingTimeMinutes = (
  value: string | null | undefined,
) => {
  const normalized = normalizeArticleText(value);

  if (!normalized) return undefined;

  const wordCount = normalized.split(" ").filter(Boolean).length;

  if (wordCount === 0) return undefined;

  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
};
