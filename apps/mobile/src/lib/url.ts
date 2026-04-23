import { urlSchema } from "@/schema/LinkSchema";

export const isUrl = (text: string): boolean => {
  return urlSchema.safeParse(text).success;
};
