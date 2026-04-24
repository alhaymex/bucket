import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getCurrentUserFromCtx } from "../auth";
import { isUrl, normalizeUrl, urlSchema } from "@bucket/common";

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

    const parsedUrl = urlSchema.safeParse(args.url);

    if (!parsedUrl.success) throw new Error("Invalid Url!");

    const normalizedUrl = normalizeUrl(parsedUrl.data);

    const collection = await ctx.db.get(args.collectionId);

    if (!collection || collection.userId !== user._id)
      throw new Error("No collection found!");

    const existingLink = await ctx.db
      .query("links")
      .withIndex("by_user_url", (q) =>
        q.eq("userId", user._id).eq("url", normalizedUrl),
      )
      .unique();

    if (existingLink) {
      await ctx.db.patch("links", existingLink._id, {
        lastViewedAt: Date.now(),
      });

      return existingLink._id;
    }

    const linkId = await ctx.db.insert("links", {
      userId: user._id,
      url: args.url,
      contentType: "article",
      status: "pending",
      tags: args.tags,
      collectionId: args.collectionId,
      isPinned: false,
      isArchived: false,
      lastViewedAt: Date.now(),
    });

    // TODO: start a background job to get the url metadata

    return linkId;
  },
});
