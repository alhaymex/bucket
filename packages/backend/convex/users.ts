import { internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      return { deleted: false as const, userId: null };
    }

    const links = await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const link of links) {
      await deleteLinkDependents(ctx, link._id);
      await ctx.db.delete("links", link._id);
    }

    const collections = await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const collection of collections) {
      await ctx.db.delete("collections", collection._id);
    }

    await ctx.db.delete("users", user._id);

    return {
      deleted: true as const,
      userId: user._id,
      deletedCollectionCount: collections.length,
      deletedLinkCount: links.length,
    };
  },
});

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const matchingUsers = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .collect();

    const [canonicalUser, ...duplicateUsers] = [...matchingUsers].sort(
      (left, right) => left._creationTime - right._creationTime,
    );

    const patch = {
      clerkId: args.clerkId,
      email: args.email,
      displayName: args.name,
      avatarUrl: args.avatar,
    };

    if (!canonicalUser) {
      const userId = await ctx.db.insert("users", patch);

      return {
        action: "created" as const,
        duplicateCountRemoved: 0,
        userId,
      };
    }

    await ctx.db.patch("users", canonicalUser._id, patch);

    for (const duplicateUser of duplicateUsers) {
      await reassignUserReferences(ctx, duplicateUser._id, canonicalUser._id);
      await ctx.db.delete("users", duplicateUser._id);
    }

    return {
      action: "updated" as const,
      duplicateCountRemoved: duplicateUsers.length,
      userId: canonicalUser._id,
    };
  },
});

async function reassignUserReferences(
  ctx: MutationCtx,
  fromUserId: Id<"users">,
  toUserId: Id<"users">,
) {
  const collections = await ctx.db
    .query("collections")
    .withIndex("by_user", (q) => q.eq("userId", fromUserId))
    .collect();

  for (const collection of collections) {
    await ctx.db.patch("collections", collection._id, { userId: toUserId });
  }

  const links = await ctx.db
    .query("links")
    .withIndex("by_user", (q) => q.eq("userId", fromUserId))
    .collect();

  for (const link of links) {
    await ctx.db.patch("links", link._id, { userId: toUserId });
  }
}

async function deleteLinkDependents(ctx: MutationCtx, linkId: Id<"links">) {
  const articlePreviews = await ctx.db
    .query("article_previews")
    .withIndex("by_link", (q) => q.eq("linkId", linkId))
    .collect();
  for (const preview of articlePreviews) {
    await ctx.db.delete("article_previews", preview._id);
  }

  const productPreviews = await ctx.db
    .query("product_previews")
    .withIndex("by_link", (q) => q.eq("linkId", linkId))
    .collect();
  for (const preview of productPreviews) {
    await ctx.db.delete("product_previews", preview._id);
  }

  const youtubePreviews = await ctx.db
    .query("youtube_previews")
    .withIndex("by_link", (q) => q.eq("linkId", linkId))
    .collect();
  for (const preview of youtubePreviews) {
    await ctx.db.delete("youtube_previews", preview._id);
  }
}
