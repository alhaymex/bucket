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
