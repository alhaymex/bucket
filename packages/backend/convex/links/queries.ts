import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getCurrentUserFromCtx } from "../auth";

export const getUserRecentLinks = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserFromCtx(ctx);

    if (!user) throw new Error("Unauthorized!");

    const recentlyViewed = await ctx.db
      .query("links")
      .withIndex("by_user_last_viewed", (q) =>
        q.eq("userId", user._id).gt("lastViewedAt", 0),
      )
      .order("desc")
      .take(12);

    const recentlyAdded = await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(12);

    const byId = new Map<string, (typeof recentlyViewed)[number]>();

    for (const link of recentlyAdded) {
      byId.set(link._id, link);
    }

    for (const link of recentlyViewed) {
      byId.set(link._id, link);
    }

    return Array.from(byId.values())
      .sort((a, b) => {
        const aTime = a.lastViewedAt ?? a._creationTime;
        const bTime = b.lastViewedAt ?? b._creationTime;

        return bTime - aTime;
      })
      .slice(0, 6);
  },
});

export const getUserLinkById = query({
  args: {
    linkId: v.id("links"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserFromCtx(ctx);

    if (!user) throw new Error("Unauthorized!");

    const link = await ctx.db.get("links", args.linkId);

    if (!link || link.userId !== user._id) {
      throw new Error("Link not found!");
    }

    const metadata = await ctx.db
      .query("link_metadata")
      .withIndex("by_link", (q) => q.eq("linkId", args.linkId))
      .unique();

    return {
      link,
      metadata,
    };
  },
});

export const getLinkById = internalQuery({
  args: {
    linkId: v.id("links"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get("links", args.linkId);
  },
});
