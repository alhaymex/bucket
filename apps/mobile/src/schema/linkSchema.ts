import { AddLinkSchema, urlSchema } from "@bucket/common";
import { z } from "zod";

export { urlSchema };

export const ConvexAddLinkSchema = AddLinkSchema.extend({
  collectionId: z.string().min(1, "Select a collection."),
});
