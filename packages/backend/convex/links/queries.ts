import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getCurrentUserFromCtx } from "../auth";

const linkContentType = v.union(
  v.literal("video"),
  v.literal("social"),
  v.literal("article"),
  v.literal("product"),
  v.literal("document"),
  v.literal("generic"),
);

const getMetadataByLinkId = async (ctx: QueryCtx, linkId: Id<"links">) => {
  return await ctx.db
    .query("link_metadata")
    .withIndex("by_link", (q) => q.eq("linkId", linkId))
    .unique();
};

const withReadingTime = async <Link extends { _id: Id<"links"> }>(
  ctx: QueryCtx,
  links: Link[],
) => {
  return await Promise.all(
    links.map(async (link) => {
      const metadata = await getMetadataByLinkId(ctx, link._id);

      return {
        ...link,
        readingTime: metadata?.readingTime,
      };
    }),
  );
};

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

    const links = Array.from(byId.values())
      .sort((a, b) => {
        const aTime = a.lastViewedAt ?? a._creationTime;
        const bTime = b.lastViewedAt ?? b._creationTime;

        return bTime - aTime;
      })
      .slice(0, 8);

    return await withReadingTime(ctx, links);
  },
});

export const searchUserLinks = query({
  args: {
    query: v.string(),
    contentType: v.optional(linkContentType),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserFromCtx(ctx);

    if (!user) throw new Error("Unauthorized!");

    const searchQuery = args.query.trim();

    if (!searchQuery) {
      return [];
    }

    const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);

    const links = await ctx.db
      .query("links")
      .withSearchIndex("search_links", (q) => {
        const filtered = q.search("title", searchQuery).eq("userId", user._id);

        if (args.contentType) {
          return filtered.eq("contentType", args.contentType);
        }

        if (args.tags && args.tags.length > 0) {
          return filtered.eq("tags", args.tags);
        }

        return filtered;
      })
      .take(limit);

    return await withReadingTime(ctx, links);
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
