import { MutationCtx, QueryCtx } from "./_generated/server";

export const getCurrentUserFromCtx = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (identity === null) {
    console.log("[auth] No Convex identity on request");
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user;
};
