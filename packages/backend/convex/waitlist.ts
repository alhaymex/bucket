import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const add = internalMutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("waitlist", {
      email: args.email,
      source: args.source,
    });
  },
});
