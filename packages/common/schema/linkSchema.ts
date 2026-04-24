import { z } from "zod";

export const urlSchema = z
  .string()
  .trim()
  .transform((val) => {
    return /^https?:\/\//i.test(val) ? val : `https://${val}`;
  })
  .refine((val) => {
    try {
      const url = new URL(val);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Invalid URL");

export const AddLinkSchema = z.object({
  url: urlSchema,
  note: z.string().optional(),
  collectionId: z.string(),
  tags: z.array(z.string()),
});

export type AddLinkType = z.infer<typeof AddLinkSchema>;
