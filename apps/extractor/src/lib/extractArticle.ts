import {
  hasUsableArticleContent,
  looksLikeBlockedPage,
  type ExtractArticleResponse,
} from "@bucket/common";
import type { Page } from "puppeteer";
import { extractorConfig } from "../config";
import { browserPool } from "./browserPool";
import { extractReadableArticle } from "./readability";

const BLOCKED_RESOURCE_TYPES = new Set<string>([
  "font",
  "image",
  "imageset",
  "media",
  "object",
  "texttrack",
]);

const enableLightweightPageMode = async (page: Page) => {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const action = BLOCKED_RESOURCE_TYPES.has(request.resourceType())
      ? request.abort()
      : request.continue();

    void action.catch(() => undefined);
  });
};

const waitForPageToSettle = async (page: Page, navigationTimeout: number) => {
  const selectorTimeout = Math.min(navigationTimeout, 5000);
  const settleTimeout = Math.min(navigationTimeout, 8000);

  await Promise.allSettled([
    page.waitForSelector("article, main, [role='main'], body", {
      timeout: selectorTimeout,
    }),
    page.waitForFunction(() => document.readyState === "complete", {
      timeout: settleTimeout,
    }),
    page.waitForNetworkIdle({
      idleTime: 500,
      timeout: settleTimeout,
    }),
  ]);
};

export const extractArticle = async ({
  url,
  timeoutMs,
}: {
  url: string;
  timeoutMs?: number;
}): Promise<ExtractArticleResponse> => {
  console.log("[extractArticle] starting", { url, timeoutMs });

  const page = await browserPool.acquirePage();
  try {
    const navigationTimeout = timeoutMs ?? extractorConfig.puppeteer.timeoutMs;

    await enableLightweightPageMode(page);

    console.log("[extractArticle] navigating", { url, navigationTimeout });
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: navigationTimeout,
    });
    console.log("[extractArticle] navigation complete, waiting for settle");

    await waitForPageToSettle(page, navigationTimeout);
    console.log("[extractArticle] page settled");

    const html = await page.content();
    const finalUrl = page.url();
    const title = await page.title().catch(() => null);

    console.log("[extractArticle] page content retrieved", {
      finalUrl,
      title,
      htmlLength: html.length,
      htmlSnippet: html.slice(0, 500),
    });

    // Diagnostic: log which blocked-page patterns match
    const bodySignals = html.slice(0, 8000);
    const allPatterns = [
      /\/cdn-cgi\/challenge-platform/i,
      /\/cdn-cgi\/l\/chk_jschl/i,
      /\/sorry\/index/i,
      /\/challenge\//i,
      /\/captcha/i,
      /just a moment/i,
      /verify (that )?you are human/i,
      /are you a human/i,
      /attention required/i,
      /checking your browser/i,
      /checking if the site connection is secure/i,
      /please stand by/i,
      /enable javascript and cookies to continue/i,
      /access denied/i,
      /access to this page has been denied/i,
      /unusual traffic/i,
      /security check/i,
      /browser check/i,
      /captcha/i,
      /cf-browser-verification/i,
      /challenge-platform/i,
      /g-recaptcha/i,
      /hcaptcha/i,
      /turnstile/i,
      /ddos-guard/i,
      /cloudflare/i,
      /ray id/i,
      /enable cookies/i,
      /enable javascript/i,
      /requires javascript/i,
      /bot detection/i,
      /automated requests/i,
    ];
    const matchedPatterns = allPatterns.filter(
      (p) => p.test(title ?? "") || p.test(bodySignals),
    );
    if (matchedPatterns.length > 0) {
      console.warn("[extractArticle] patterns that matched", {
        url,
        matched: matchedPatterns.map((p) => p.source),
      });
    }

    if (looksLikeBlockedPage({ title, finalUrl, html })) {
      console.warn("[extractArticle] blocked page detected (pre-readability)", {
        url,
        finalUrl,
        title,
      });
      return {
        status: "blocked",
        finalUrl,
        errorCode: "ANTI_BOT_PAGE",
        errorMessage: "Rendered page still appears blocked",
      };
    }

    const article = extractReadableArticle({
      html,
      url: finalUrl,
    });

    console.log("[extractArticle] readability result", {
      url,
      hasArticle: !!article,
      articleTitle: article?.title ?? null,
      contentLength: article?.content?.length ?? 0,
      textContentLength: article?.textContent?.length ?? 0,
      siteName: article?.siteName ?? null,
      textSnippet: article?.textContent?.slice(0, 500) ?? null,
      htmlSnippet: article?.content?.slice(0, 500) ?? null,
    });

    if (
      looksLikeBlockedPage({
        title: article?.title ?? title,
        finalUrl,
        html: article?.content ?? html,
        text: article?.textContent,
      })
    ) {
      console.warn(
        "[extractArticle] blocked page detected (post-readability)",
        {
          url,
          finalUrl,
          title: article?.title ?? title,
        },
      );
      return {
        status: "blocked",
        finalUrl,
        errorCode: "ANTI_BOT_PAGE",
        errorMessage: "Rendered page still appears blocked",
      };
    }

    if (!article || !hasUsableArticleContent(article.content)) {
      console.warn("[extractArticle] unreadable content", {
        url,
        finalUrl,
        hasArticle: !!article,
        contentLength: article?.content?.length ?? 0,
      });
      return {
        status: "unreadable",
        finalUrl,
        errorCode: "NO_READABLE_CONTENT",
        errorMessage: "Rendered page did not produce readable article content",
      };
    }

    console.log("[extractArticle] success", {
      url,
      finalUrl,
      title: article.title,
    });

    return {
      status: "ok",
      finalUrl,
      title: article.title ?? undefined,
      excerpt: article.excerpt ?? undefined,
      byline: article.byline ?? undefined,
      siteName: article.siteName ?? undefined,
      lang: article.lang ?? undefined,
      textContent: article.textContent ?? undefined,
      htmlFragment: article.content ?? undefined,
    };
  } catch (error) {
    console.error("[extractArticle] extraction failed", {
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      status: "error",
      errorCode: "EXTRACTION_FAILED",
      errorMessage:
        error instanceof Error ? error.message : "Unknown extraction error",
    };
  } finally {
    await browserPool.releasePage(page);
  }
};
