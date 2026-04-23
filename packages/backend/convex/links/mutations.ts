import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getCurrentUserFromCtx } from "../auth";
import { isUrl } from "@bucket/common";

export const saveLink = mutation({
  args: {
    url: v.string(),
    note: v.optional(v.string()),
    collectionId: v.id("collections"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserFromCtx(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!isUrl(args.url)) throw new Error("Invalid Url!");

    const existingCollection = await ctx.db
      .query("collections")
      .withIndex("by_id", (q) => q.eq("_id", args.collectionId))
      .collect();

    if (!existingCollection) throw new Error("No collection found!");

    // TODO: handle auto detect content type

    // TODO: handle duplicate links

    // TODO: start a background job to get the url metadata

    await ctx.db.insert("links", {
      userId: user._id,
      url: args.url,
      contentType: "article",
      status: "pending",
      tags: args.tags,
      collectionId: args.collectionId,
    });
  },
});
