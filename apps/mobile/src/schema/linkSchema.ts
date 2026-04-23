import { AddLinkSchema } from "@bucket/common";
import { zid } from "convex-helpers/server/zod4";

export const ConvexAddLinkSchema = AddLinkSchema.extend({
  collectionId: zid("collections"),
});
