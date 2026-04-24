import { urlSchema } from "@bucket/common";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";
import { getCurrentUserFromCtx } from "../auth";
import { analyzeUrl } from "../utils/links";

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

    const analyzed = analyzeUrl(parsedUrl.data);

    const collection = await ctx.db.get(args.collectionId);

    if (!collection || collection.userId !== user._id)
      throw new Error("No collection found!");

    const existingLink = await ctx.db
      .query("links")
      .withIndex("by_user_url", (q) =>
        q.eq("userId", user._id).eq("canonicalUrl", analyzed.canonicalUrl),
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
      url: parsedUrl.data,
      canonicalUrl: analyzed.canonicalUrl,
      sourceHost: analyzed.sourceHost,
      platform: analyzed.platform,
      externalId: analyzed.externalId,
      embedUrl: analyzed.embedUrl,
      contentType: analyzed.contentType,
      renderType: analyzed.renderType,
      status: "pending",
      tags: args.tags,
      note: args.note,
      collectionId: args.collectionId,
      isPinned: false,
      isArchived: false,
      lastViewedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.links.actions.getOpenGraph, {
      linkId,
    });

    return linkId;
  },
});

export const updateLinkOpenGraph = internalMutation({
  args: {
    linkId: v.id("links"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    siteName: v.optional(v.string()),
    html: v.optional(v.string()),
    text: v.optional(v.string()),
    readingTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.linkId, {
      title: args.title,
      description: args.description,
      faviconUrl: args.faviconUrl,
      thumbnailUrl: args.thumbnailUrl,
      status: "ready",
    });

    const existingMetadata = await ctx.db
      .query("link_metadata")
      .withIndex("by_link", (q) => q.eq("linkId", args.linkId))
      .unique();

    const metadata = {
      linkId: args.linkId,
      siteName: args.siteName,
      html: args.html,
      text: args.text,
      readingTime: args.readingTime,
      images: args.thumbnailUrl ? [args.thumbnailUrl] : [],
      fetchedAt: Date.now(),
    };

    if (existingMetadata) {
      await ctx.db.patch(existingMetadata._id, metadata);
    } else {
      await ctx.db.insert("link_metadata", metadata);
    }
  },
});

export const markLinkOpenGraphError = internalMutation({
  args: {
    linkId: v.id("links"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.linkId, {
      status: "error",
    });
  },
});
