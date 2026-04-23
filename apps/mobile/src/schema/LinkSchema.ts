import { z } from "zod";

export const urlSchema = z.url();

export const AddLinkSchema = z.object({
  link: urlSchema,
  note: z.string().optional(),
  collectionId: z.string(),
  tags: z.array(z.string()),
});

export type AddLinkType = z.infer<typeof AddLinkSchema>;
