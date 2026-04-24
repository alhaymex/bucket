import { urlSchema } from "../schema/linkSchema";

export const isUrl = (text: string): boolean => {
  return urlSchema.safeParse(text).success;
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const normalizeUrl = (url: string) => {
  const parsed = new URL(url);

  parsed.hash = "";
  parsed.hostname = parsed.hostname.replace(/^www\./, "");

  return parsed.toString();
};


