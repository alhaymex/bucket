import { urlSchema } from "../schema/linkSchema";

export const isUrl = (text: string): boolean => {
  return urlSchema.safeParse(text).success;
};
