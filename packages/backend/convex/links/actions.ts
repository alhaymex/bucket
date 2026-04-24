import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { DOMParser } from "linkedom";
import { sanitizeArticleHtml } from "../utils/html";

const toOptionalString = (value: string | null | undefined) =>
  value ?? undefined;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeTitle = ({
  title,
  siteName,
}: {
  title: string | null | undefined;
  siteName: string | null | undefined;
}) => {
  if (!title) return undefined;

  let normalizedTitle = title.trim();
  const normalizedSiteName = siteName?.trim();

  if (!normalizedSiteName) return normalizedTitle || undefined;

  const duplicatedSiteSuffix = new RegExp(
    `\\s*[\\-–|:]\\s*${escapeRegex(normalizedSiteName)}(?:\\s*[\\-–|:]\\s*${escapeRegex(normalizedSiteName)})+$`,
    "i",
  );
  const siteSuffix = new RegExp(
    `\\s*[\\-–|:]\\s*${escapeRegex(normalizedSiteName)}$`,
    "i",
  );

  normalizedTitle = normalizedTitle.replace(duplicatedSiteSuffix, "");
  normalizedTitle = normalizedTitle.replace(siteSuffix, "");

  return normalizedTitle.trim() || undefined;
};

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
      const sanitizedHtml = article?.content
        ? sanitizeArticleHtml({
            html: article.content,
            baseUrl: link.canonicalUrl,
          })
        : undefined;

      const getMeta = (name: string) =>
        $(`meta[property="${name}"]`).attr("content") ||
        $(`meta[name="${name}"]`).attr("content");

      const title = getMeta("og:title") || $("title").text() || undefined;

      const description = getMeta("og:description") || getMeta("description");

      const image = getMeta("og:image");
      const siteName = getMeta("og:site_name") || article?.siteName;
      const resolvedTitle = normalizeTitle({
        title: article?.title || getMeta("og:title") || $("title").text(),
        siteName,
      });

      const favicon =
        $('link[rel="icon"]').attr("href") ||
        new URL("/favicon.ico", link.canonicalUrl).toString();

      await ctx.runMutation(internal.links.mutations.updateLinkOpenGraph, {
        linkId: linkId,
        title: toOptionalString(resolvedTitle),
        description: toOptionalString(description || article?.excerpt),
        thumbnailUrl: toOptionalString(image),
        faviconUrl: favicon,
        siteName: toOptionalString(siteName),
        html: toOptionalString(sanitizedHtml),
      });

      console.log("[DEBUG] OpenGraph fetched for ", {
        linkId: linkId,
        title: resolvedTitle,
        description: description || article?.excerpt,
        image,
        favicon,
        hasReadableHtml: Boolean(sanitizedHtml),
      });
    } catch {
      await ctx.runMutation(internal.links.mutations.markLinkOpenGraphError, {
        linkId: linkId,
      });
    }
  },
});
