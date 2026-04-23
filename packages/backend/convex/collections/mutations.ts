import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getCurrentUserFromCtx } from "../auth";
import { slugify } from "@bucket/common";

export const createCollection = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserFromCtx(ctx);
    if (!user) throw new Error("Unauthorized!");

    const collectionSlug = slugify(args.name);
    
    // TODO: make sure the icon is the correct type

    await ctx.db.insert("collections", {
      userId: user._id,
      name: args.name,
      slug: collectionSlug,
      description: args.description,
      icon: args.icon,
      type: "user",
      sortOrder: 0,
    });
  },
});
