import { AddLinkSchema, urlSchema } from "@bucket/common";
import { zid } from "convex-helpers/server/zod4";

export { urlSchema };

export const ConvexAddLinkSchema = AddLinkSchema.extend({
  collectionId: zid("collections"),
});
