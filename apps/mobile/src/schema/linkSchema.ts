import { AddLinkSchema } from "@bucket/common";
import { z } from "zod";

export const ConvexAddLinkSchema = AddLinkSchema.extend({
  collectionId: z.string().min(1, "Select a collection."),
});
