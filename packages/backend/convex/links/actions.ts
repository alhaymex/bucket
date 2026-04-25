import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { internalAction } from "../_generated/server";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { DOMParser } from "linkedom";
import { callExtractor } from "../utils/extractorClient";
import {
  calculateReadingTimeMinutes,
  normalizeArticleText,
} from "../utils/article";
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

const BLOCKED_PAGE_PATTERNS = [
  /just a moment/i,
  /verify you are human/i,
  /attention required/i,
  /cf-browser-verification/i,
  /challenge-platform/i,
  /cloudflare/i,
] as const;

const looksBlocked = ({
  title,
  html,
}: {
  title: string | null | undefined;
  html: string;
}) => {
  const signals = `${title ?? ""}\n${html.slice(0, 4000)}`;

  return BLOCKED_PAGE_PATTERNS.some((pattern) => pattern.test(signals));
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

type OpenGraphActionCtx = Pick<ActionCtx, "runQuery" | "runMutation">;

export const handleOpenGraph = async (
  ctx: OpenGraphActionCtx,
  { linkId }: { linkId: Id<"links"> },
) => {
  const link = await ctx.runQuery(internal.links.queries.getLinkById, {
    linkId: linkId,
  });

  if (!link) return;

  if (link.renderType === "pdf") {
    await ctx.runMutation(internal.links.mutations.updateLinkOpenGraph, {
      linkId,
      title: toOptionalString(getFilenameTitle(link.canonicalUrl)),
      description: "PDF document",
      faviconUrl: new URL("/favicon.ico", link.canonicalUrl).toString(),
    });
    return;
  }

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
    const articleText = normalizeArticleText(article?.textContent);

    const getMeta = (name: string) =>
      $(`meta[property="${name}"]`).attr("content") ||
      $(`meta[name="${name}"]`).attr("content");

    const siteName = getMeta("og:site_name") || article?.siteName;
    const favicon = resolveUrl(
      $('link[rel~="icon"]').attr("href") ||
        $('link[rel="shortcut icon"]').attr("href"),
      link.canonicalUrl,
    );
    const fallbackFavicon = new URL(
      "/favicon.ico",
      link.canonicalUrl,
    ).toString();
    const image = resolveUrl(getMeta("og:image"), link.canonicalUrl);

    if (link.renderType === "embed") {
      await ctx.runMutation(internal.links.mutations.updateLinkOpenGraph, {
        linkId,
        title: toOptionalString(
          normalizeTitle({
            title: getMeta("og:title") || $("title").text(),
            siteName,
          }),
        ),
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

    const resolvedTitle = normalizeTitle({
      title: article?.title || getMeta("og:title") || $("title").text(),
      siteName,
    });

    const shouldUseExtractorFallback =
      !res.ok ||
      looksBlocked({
        title: resolvedTitle,
        html,
      }) ||
      !hasUsableArticleContent(sanitizedHtml);

    if (shouldUseExtractorFallback) {
      try {
        const extractorResponse = await callExtractor({
          url: link.canonicalUrl,
        });

        if (
          extractorResponse.status === "ok" &&
          extractorResponse.htmlFragment
        ) {
          const fallbackHtml = sanitizeArticleHtml({
            html: extractorResponse.htmlFragment,
            baseUrl: extractorResponse.finalUrl || link.canonicalUrl,
          });
          const fallbackSiteName = extractorResponse.siteName || siteName;
          const fallbackTitle = normalizeTitle({
            title: extractorResponse.title || resolvedTitle,
            siteName: fallbackSiteName,
          });
          const fallbackText = normalizeArticleText(
            extractorResponse.textContent,
          );

          await ctx.runMutation(internal.links.mutations.updateLinkOpenGraph, {
            linkId: linkId,
            title: toOptionalString(fallbackTitle),
            description: toOptionalString(
              extractorResponse.excerpt || description || article?.excerpt,
            ),
            thumbnailUrl: toOptionalString(image),
            faviconUrl: favicon ?? fallbackFavicon,
            siteName: toOptionalString(fallbackSiteName),
            html: toOptionalString(fallbackHtml),
            text: toOptionalString(fallbackText),
            readingTime: calculateReadingTimeMinutes(fallbackText),
          });

          console.log("[DEBUG] Extractor fallback fetched for ", {
            linkId: linkId,
            title: fallbackTitle,
            status: extractorResponse.status,
            hasReadableHtml: Boolean(fallbackHtml),
          });

          return;
        }
      } catch (error) {
        console.error("[extractor-fallback] failed", {
          error: error instanceof Error ? error.message : "unknown_error",
          linkId,
        });
      }
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
