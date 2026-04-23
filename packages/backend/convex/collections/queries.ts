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
