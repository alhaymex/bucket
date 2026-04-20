import { query } from "./_generated/server";

export const getStuff = query({
  args: {},
  handler: async (ctx) => {
    const rand = Array.from({ length: 10 }, (_, i) => `Type Shit ${i + 1}`);

    return rand;
  },
});
