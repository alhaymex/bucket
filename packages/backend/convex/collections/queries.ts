import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUserFromCtx } from "../auth";

export const getUserCollections = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserFromCtx(ctx);
    if (!user) throw new Error("Unauthorized!");

    const collections = await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return collections.sort((left, right) => {
      if (left.type !== right.type) {
        return left.type === "system" ? -1 : 1;
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.name.localeCompare(right.name);
    });
  },
});

export const getCollectionById = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, { collectionId }) => {
    const user = await getCurrentUserFromCtx(ctx);
    if (!user) throw new Error("Unauthorized!");

    const collection = await ctx.db
      .query("collections")
      .withIndex("by_id", (q) => q.eq("_id", collectionId))
      .first();

    if (!collection) throw new Error("Collection not found");
    if (collection.userId !== user._id) throw new Error("Forbidden!");

    const links = await ctx.db
      .query("links")
      .withIndex("by_user_collection", (q) =>
        q.eq("userId", user._id).eq("collectionId", collectionId),
      )
      .collect();

    return { ...collection, links };
  },
});
