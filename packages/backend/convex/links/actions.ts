import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import * as cheerio from "cheerio";

export const getOpenGraph = internalAction({
  args: { linkId: v.id("links") },
  handler: async (ctx, { linkId }) => {
    const link = await ctx.runQuery(internal.links.queries.getLinkById, {
      linkId: linkId,
    });

    if (!link) return;

    try {
      const res = await fetch(link.canonicalUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      const html = await res.text();
      const $ = cheerio.load(html);

      const getMeta = (name: string) =>
        $(`meta[property="${name}"]`).attr("content") ||
        $(`meta[name="${name}"]`).attr("content");

      const title = getMeta("og:title") || $("title").text() || undefined;

      const description = getMeta("og:description") || getMeta("description");

      const image = getMeta("og:image");

      const favicon =
        $('link[rel="icon"]').attr("href") ||
        new URL("/favicon.ico", link.canonicalUrl).toString();

      await ctx.runMutation(internal.links.mutations.updateLinkOpenGraph, {
        linkId: linkId,
        title,
        description,
        thumbnailUrl: image,
        faviconUrl: favicon,
        html,
      });

      console.log("[DEBUG] OpenGraph fetched for ", {
        linkId: linkId,
        title,
        description,
        image,
        favicon,
      });
    } catch (error) {
      await ctx.runMutation(internal.links.mutations.markLinkOpenGraphError, {
        linkId: linkId,
      });
    }
  },
});
