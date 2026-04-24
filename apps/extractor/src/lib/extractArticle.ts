import {
  hasUsableArticleContent,
  type ExtractArticleResponse,
} from "@bucket/common";
import { extractorConfig } from "../config";
import { launchBrowser } from "./browser";
import { extractReadableArticle } from "./readability";

const BLOCKED_RESOURCE_TYPES = new Set<string>([
  "font",
  "image",
  "imageset",
  "media",
  "object",
  "texttrack",
]);

const BLOCKED_PAGE_PATTERNS = [
  /just a moment/i,
  /verify you are human/i,
  /attention required/i,
  /checking your browser/i,
  /please stand by/i,
  /enable javascript and cookies to continue/i,
  /captcha/i,
  /access denied/i,
  /cf-browser-verification/i,
  /challenge-platform/i,
  /cloudflare/i,
] as const;

const BLOCKED_URL_PATTERNS = [
  /\/cdn-cgi\/challenge-platform/i,
  /\/cdn-cgi\/l\/chk_jschl/i,
] as const;

const looksBlocked = ({
  title,
  finalUrl,
  html,
}: {
  title: string | null | undefined;
  finalUrl: string;
  html: string;
}) => {
  if (BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(finalUrl))) {
    return true;
  }

  const signals = `${title ?? ""}\n${html.slice(0, 8000)}`;
  const signalCount = BLOCKED_PAGE_PATTERNS.filter((pattern) =>
    pattern.test(signals),
  ).length;

  return signalCount >= 2;
};

const enableLightweightPageMode = async (
  page: Awaited<ReturnType<typeof launchBrowser>> extends {
    newPage: () => Promise<infer T>;
  }
    ? T
    : never,
) => {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const action = BLOCKED_RESOURCE_TYPES.has(request.resourceType())
      ? request.abort()
      : request.continue();

    void action.catch(() => undefined);
  });
};

const waitForPageToSettle = async (
  page: Awaited<ReturnType<typeof launchBrowser>> extends {
    newPage: () => Promise<infer T>;
  }
    ? T
    : never,
  navigationTimeout: number,
) => {
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
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    const navigationTimeout = timeoutMs ?? extractorConfig.puppeteer.timeoutMs;

    await enableLightweightPageMode(page);

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: navigationTimeout,
    });

    await waitForPageToSettle(page, navigationTimeout);

    const html = await page.content();
    const finalUrl = page.url();
    const title = await page.title().catch(() => null);
    const article = extractReadableArticle({
      html,
      url: finalUrl,
    });

    if (looksBlocked({ title: article?.title ?? title, finalUrl, html })) {
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
