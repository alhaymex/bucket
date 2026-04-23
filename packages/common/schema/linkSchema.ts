import { z } from "zod";

export const urlSchema = z
  .string()
  .transform((val) => {
    const trimmed = val.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  })
  .pipe(
    z
      .string()
      .regex(/^https?:\/\/([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i, "Invalid URL"),
  );

export const AddLinkSchema = z.object({
  url: urlSchema,
  note: z.string().optional(),
  collectionId: z.string(),
  tags: z.array(z.string()),
});

export type AddLinkType = z.infer<typeof AddLinkSchema>;
