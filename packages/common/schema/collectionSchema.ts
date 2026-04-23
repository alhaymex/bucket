import { z } from "zod";

export const CreateCollectionSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type CreateCollectionType = z.infer<typeof CreateCollectionSchema>;
