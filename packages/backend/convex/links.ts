import { mutation } from "./_generated/server";
import { getCurrentUserFromCtx } from "./auth";

export const saveLink = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserFromCtx(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    console.log(user);
  },
});
