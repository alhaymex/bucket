export const hasUsableArticleContent = (html: string | null | undefined) => {
  if (!html) return false;

  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length >= 200;
};
