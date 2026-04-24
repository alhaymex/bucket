import {
  hasUsableArticleContent,
  type ExtractArticleResponse,
} from "@bucket/common";
import { extractorConfig } from "../config";
import { launchBrowser } from "./browser";
import { extractReadableArticle } from "./readability";

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

export const extractArticle = async ({
  url,
  timeoutMs,
}: {
  url: string;
  timeoutMs?: number;
}): Promise<ExtractArticleResponse> => {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    const navigationTimeout = timeoutMs ?? extractorConfig.puppeteer.timeoutMs;

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: navigationTimeout,
    });

    await page
      .waitForSelector("article, main, body", {
        timeout: Math.min(navigationTimeout, 5000),
      })
      .catch(() => undefined);

    const html = await page.content();
    const finalUrl = page.url();
    const article = extractReadableArticle({
      html,
      url: finalUrl,
    });

    if (looksBlocked({ title: article?.title, html })) {
      return {
        status: "blocked",
        finalUrl,
        errorCode: "ANTI_BOT_PAGE",
        errorMessage: "Rendered page still appears blocked",
      };
    }

    if (!article || !hasUsableArticleContent(article.content)) {
      return {
        status: "unreadable",
        finalUrl,
        errorCode: "NO_READABLE_CONTENT",
        errorMessage: "Rendered page did not produce readable article content",
      };
    }

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
    return {
      status: "error",
      errorCode: "EXTRACTION_FAILED",
      errorMessage:
        error instanceof Error ? error.message : "Unknown extraction error",
    };
  } finally {
    await browser.close();
  }
};
