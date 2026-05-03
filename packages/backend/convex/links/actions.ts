"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { internalAction } from "../_generated/server";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { looksLikeBlockedPage, urlSchema } from "@bucket/common";
import { DOMParser } from "linkedom";
import { callExtractor } from "../utils/extractorClient";
import {
  calculateReadingTimeMinutes,
  normalizeArticleText,
} from "../utils/article";
import { sanitizeArticleHtml } from "../utils/html";
import { fetchYouTubeOEmbed } from "../utils/youtube";
import { fetchMetadataHtml } from "../utils/safeFetch";

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

const hasUsableArticleContent = (html: string | undefined) => {
  if (!html) return false;

  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length >= 200;
};

const resolveUrl = (value: string | undefined, baseUrl: string) => {
  if (!value) return undefined;

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
};

const getFilenameTitle = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").filter(Boolean).at(-1);

    if (!filename) return undefined;

    return decodeURIComponent(filename)
      .replace(/\.pdf$/i, "")
      .trim();
  } catch {
    return undefined;
  }
};

const getHostnameTitle = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^\[(.*)\]$/, "$1");
  } catch {
    return undefined;
  }
};

const getLogHostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
};

type OpenGraphActionCtx = Pick<ActionCtx, "runQuery" | "runMutation">;

export const handleOpenGraph = async (
  ctx: OpenGraphActionCtx,
  { linkId }: { linkId: Id<"links"> },
) => {
  const link = await ctx.runQuery(internal.links.queries.getLinkById, {
    linkId: linkId,
  });

  if (!link) return;

  const canonicalUrl = urlSchema.safeParse(link.canonicalUrl);

  if (!canonicalUrl.success) {
    await ctx.runMutation(internal.links.mutations.markLinkOpenGraphError, {
      linkId,
    });
    return;
  }

  if (link.renderType === "pdf") {
    await ctx.runMutation(internal.links.mutations.updateLinkOpenGraph, {
      linkId,
      title: toOptionalString(getFilenameTitle(canonicalUrl.data)),
      description: "PDF document",
      faviconUrl: new URL("/favicon.ico", canonicalUrl.data).toString(),
    });
    return;
  }

  const fallbackFavicon = new URL("/favicon.ico", canonicalUrl.data).toString();
  const hostname = getLogHostname(canonicalUrl.data);

  const tryExtractorFallback = async ({
    siteName,
    resolvedTitle,
    description,
    excerpt,
    image,
    favicon,
  }: {
    siteName?: string;
    resolvedTitle?: string;
    description?: string;
    excerpt?: string;
    image?: string;
    favicon?: string;
  }) => {
    try {
      const extractorResponse = await callExtractor({
        url: canonicalUrl.data,
      });

      if (extractorResponse.status === "ok" && extractorResponse.htmlFragment) {
        const fallbackHtml = sanitizeArticleHtml({
          html: extractorResponse.htmlFragment,
          baseUrl: extractorResponse.finalUrl || canonicalUrl.data,
        });
        const fallbackSiteName = extractorResponse.siteName || siteName;
        const fallbackTitle = normalizeTitle({
          title: extractorResponse.title || resolvedTitle,
          siteName: fallbackSiteName,
        });
        const fallbackText = normalizeArticleText(
          extractorResponse.textContent,
        );

        if (
          looksLikeBlockedPage({
            title: fallbackTitle,
            finalUrl: extractorResponse.finalUrl,
            html: fallbackHtml,
            text: fallbackText,
          }) ||
          (!hasUsableArticleContent(fallbackHtml) &&
            !hasUsableArticleContent(fallbackText))
        ) {
          console.warn("[metadata-fetch] extractor fallback unusable", {
            linkId,
            stage: "extractor",
            status: extractorResponse.status,
            hostname,
          });
          return false;
        }

        await ctx.runMutation(internal.links.mutations.updateLinkOpenGraph, {
          linkId: linkId,
          title: toOptionalString(fallbackTitle),
          description: toOptionalString(
            extractorResponse.excerpt || description || excerpt,
          ),
          thumbnailUrl: toOptionalString(image),
          faviconUrl: favicon ?? fallbackFavicon,
          siteName: toOptionalString(fallbackSiteName),
          html: toOptionalString(fallbackHtml),
          text: toOptionalString(fallbackText),
          readingTime: calculateReadingTimeMinutes(fallbackText),
        });

        return true;
      }

      console.warn("[metadata-fetch] extractor fallback failed", {
        linkId,
        stage: "extractor",
        status: extractorResponse.status,
        hostname,
      });
    } catch (error) {
      console.error("[metadata-fetch] extractor fallback failed", {
        linkId,
        stage: "extractor",
        hostname,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }

    return false;
  };

  try {
    const directFetch = await fetchMetadataHtml(canonicalUrl.data);

    if (!directFetch.ok) {
      console.warn("[metadata-fetch] direct fetch failed", {
        linkId,
        stage: "direct",
        reason: directFetch.reason,
        status: directFetch.status,
        hostname,
      });

      if (link.renderType === "embed") {
        await ctx.runMutation(internal.links.mutations.updateLinkOpenGraph, {
          linkId,
          title: toOptionalString(
            link.title || getHostnameTitle(canonicalUrl.data),
          ),
          faviconUrl: fallbackFavicon,
        });
        return;
      }

      const fallbackSucceeded = await tryExtractorFallback({});

      if (!fallbackSucceeded) {
        await ctx.runMutation(internal.links.mutations.markLinkOpenGraphError, {
          linkId,
        });
      }

      return;
    }

    const html = directFetch.text;
    const metadataBaseUrl = directFetch.url;
    const $ = cheerio.load(html);
    const document = new DOMParser().parseFromString(
      html,
      "text/html",
    ) as unknown as Document;
    const article = new Readability(document).parse();
    const sanitizedHtml = article?.content
      ? sanitizeArticleHtml({
          html: article.content,
          baseUrl: metadataBaseUrl,
        })
      : undefined;
    const articleText = normalizeArticleText(article?.textContent);

    const getMeta = (name: string) =>
      $(`meta[property="${name}"]`).attr("content") ||
      $(`meta[name="${name}"]`).attr("content");

    const siteName = getMeta("og:site_name") || article?.siteName;
    const favicon = resolveUrl(
      $('link[rel~="icon"]').attr("href") ||
        $('link[rel="shortcut icon"]').attr("href"),
      metadataBaseUrl,
    );
    const htmlImage = resolveUrl(getMeta("og:image"), metadataBaseUrl);
    const youtubeOEmbed =
      link.platform === "youtube"
        ? await fetchYouTubeOEmbed({
            canonicalUrl: canonicalUrl.data,
          })
        : null;
    const image = youtubeOEmbed?.thumbnailUrl ?? htmlImage;
    const preferredTitle =
      youtubeOEmbed?.title ||
      normalizeTitle({
        title: article?.title || getMeta("og:title") || $("title").text(),
        siteName,
      });

    if (link.renderType === "embed") {
      await ctx.runMutation(internal.links.mutations.updateLinkOpenGraph, {
        linkId,
        title: toOptionalString(preferredTitle),
        description: toOptionalString(
          getMeta("og:description") || getMeta("description"),
        ),
        thumbnailUrl: toOptionalString(image),
        faviconUrl: favicon ?? fallbackFavicon,
        siteName: toOptionalString(siteName),
      });
      return;
    }

    const description = getMeta("og:description") || getMeta("description");
    const resolvedTitle = preferredTitle;

    const shouldUseExtractorFallback =
      looksLikeBlockedPage({
        title: resolvedTitle,
        finalUrl: metadataBaseUrl,
        html,
      }) || !hasUsableArticleContent(sanitizedHtml);

    if (shouldUseExtractorFallback) {
      const fallbackSucceeded = await tryExtractorFallback({
        siteName: siteName ?? undefined,
        resolvedTitle,
        description: description ?? undefined,
        excerpt: article?.excerpt ?? undefined,
        image: image ?? undefined,
        favicon: favicon ?? undefined,
      });

      if (fallbackSucceeded) {
        return;
      }

      await ctx.runMutation(internal.links.mutations.markLinkOpenGraphError, {
        linkId,
      });
      return;
    }

    await ctx.runMutation(internal.links.mutations.updateLinkOpenGraph, {
      linkId: linkId,
      title: toOptionalString(resolvedTitle),
      description: toOptionalString(description || article?.excerpt),
      thumbnailUrl: toOptionalString(image),
      faviconUrl: favicon ?? fallbackFavicon,
      siteName: toOptionalString(siteName),
      html: toOptionalString(sanitizedHtml),
      text: toOptionalString(articleText),
      readingTime: calculateReadingTimeMinutes(articleText),
    });
  } catch {
    await ctx.runMutation(internal.links.mutations.markLinkOpenGraphError, {
      linkId: linkId,
    });
  }
};

export const getOpenGraph = internalAction({
  args: { linkId: v.id("links") },
  handler: handleOpenGraph,
});
