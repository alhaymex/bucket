import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { DOMParser } from "linkedom";

const toOptionalString = (value: string | null | undefined) => value ?? undefined;

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
      const document = new DOMParser().parseFromString(
        html,
        "text/html",
      ) as unknown as Document;
      const article = new Readability(document).parse();

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
        title: toOptionalString(title || article?.title),
        description: toOptionalString(description || article?.excerpt),
        thumbnailUrl: toOptionalString(image),
        faviconUrl: favicon,
        siteName: toOptionalString(getMeta("og:site_name") || article?.siteName),
        html: toOptionalString(article?.content),
      });

      console.log("[DEBUG] OpenGraph fetched for ", {
        linkId: linkId,
        title: title || article?.title,
        description: description || article?.excerpt,
        image,
        favicon,
        hasReadableHtml: Boolean(article?.content),
      });
    } catch {
      await ctx.runMutation(internal.links.mutations.markLinkOpenGraphError, {
        linkId: linkId,
      });
    }
  },
});
