import { afterEach, describe, expect, it, vi } from "vitest";

const { launchBrowserMock, extractReadableArticleMock } = vi.hoisted(() => ({
  launchBrowserMock: vi.fn(),
  extractReadableArticleMock: vi.fn(),
}));

vi.mock("../src/lib/browser", () => ({
  launchBrowser: launchBrowserMock,
}));

vi.mock("../src/lib/readability", () => ({
  extractReadableArticle: extractReadableArticleMock,
}));

import { extractArticle } from "../src/lib/extractArticle";

const createPageDouble = () => {
  const requestHandlers: Array<(request: any) => void> = [];

  return {
    requestHandlers,
    page: {
      setRequestInterception: vi.fn().mockResolvedValue(undefined),
      on: vi.fn((event: string, handler: (request: any) => void) => {
        if (event === "request") {
          requestHandlers.push(handler);
        }
      }),
      setUserAgent: vi.fn().mockResolvedValue(undefined),
      goto: vi.fn().mockResolvedValue(undefined),
      waitForSelector: vi.fn().mockResolvedValue(undefined),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
      content: vi.fn().mockResolvedValue("<html><body></body></html>"),
      url: vi.fn().mockReturnValue("https://example.com/final"),
      title: vi.fn().mockResolvedValue("Example page"),
    },
  };
};

const createBrowserDouble = () => {
  const { page, requestHandlers } = createPageDouble();

  return {
    page,
    requestHandlers,
    browser: {
      newPage: vi.fn().mockResolvedValue(page),
      close: vi.fn().mockResolvedValue(undefined),
    },
  };
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("extractArticle", () => {
  it("returns extracted article data and uses the provided timeout", async () => {
    const { page, browser } = createBrowserDouble();
    launchBrowserMock.mockResolvedValue(browser);
    page.content.mockResolvedValue(
      "<html><body><article>Readable article body</article></body></html>",
    );
    extractReadableArticleMock.mockReturnValue({
      title: "Example Article",
      excerpt: "Example excerpt",
      byline: "Example Author",
      siteName: "Example Site",
      lang: "en",
      textContent: "A".repeat(300),
      content: `<article><p>${"A".repeat(300)}</p></article>`,
    });

    const response = await extractArticle({
      url: "https://example.com/source",
      timeoutMs: 1234,
    });

    expect(response).toEqual({
      status: "ok",
      finalUrl: "https://example.com/final",
      title: "Example Article",
      excerpt: "Example excerpt",
      byline: "Example Author",
      siteName: "Example Site",
      lang: "en",
      textContent: "A".repeat(300),
      htmlFragment: `<article><p>${"A".repeat(300)}</p></article>`,
    });
    expect(page.goto).toHaveBeenCalledWith("https://example.com/source", {
      waitUntil: "domcontentloaded",
      timeout: 1234,
    });
    expect(page.setRequestInterception).toHaveBeenCalledWith(true);
    expect(page.waitForSelector).toHaveBeenCalledWith(
      "article, main, [role='main'], body",
      {
        timeout: 1234,
      },
    );
    expect(page.waitForFunction).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 1234,
    });
    expect(page.waitForNetworkIdle).toHaveBeenCalledWith({
      idleTime: 500,
      timeout: 1234,
    });
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("uses the configured default timeout when one is not provided", async () => {
    const { page, browser } = createBrowserDouble();
    launchBrowserMock.mockResolvedValue(browser);
    extractReadableArticleMock.mockReturnValue({
      title: "Example Article",
      textContent: "A".repeat(300),
      content: `<article><p>${"A".repeat(300)}</p></article>`,
    });

    await extractArticle({
      url: "https://example.com/source",
    });

    expect(page.goto).toHaveBeenCalledWith("https://example.com/source", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    expect(page.waitForSelector).toHaveBeenCalledWith(
      "article, main, [role='main'], body",
      {
        timeout: 5000,
      },
    );
    expect(page.waitForFunction).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 8000,
    });
    expect(page.waitForNetworkIdle).toHaveBeenCalledWith({
      idleTime: 500,
      timeout: 8000,
    });
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("returns blocked when the rendered page looks like an anti-bot challenge", async () => {
    const { page, browser } = createBrowserDouble();
    launchBrowserMock.mockResolvedValue(browser);
    page.content.mockResolvedValue(
      "<html><body><h1>Just a moment...</h1><p>Checking your browser before accessing the page.</p></body></html>",
    );
    extractReadableArticleMock.mockReturnValue({
      title: "Just a moment",
      content: `<article><p>${"A".repeat(300)}</p></article>`,
      textContent: "A".repeat(300),
    });

    const response = await extractArticle({
      url: "https://example.com/source",
    });

    expect(response).toEqual({
      status: "blocked",
      finalUrl: "https://example.com/final",
      errorCode: "ANTI_BOT_PAGE",
      errorMessage: "Rendered page still appears blocked",
    });
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("returns blocked for one-hit anti-bot page titles before storing readable-looking content", async () => {
    const { page, browser } = createBrowserDouble();
    launchBrowserMock.mockResolvedValue(browser);
    page.title.mockResolvedValue("Access Denied");
    page.content.mockResolvedValue(
      `<html><body><article><p>${"A".repeat(300)}</p></article></body></html>`,
    );
    extractReadableArticleMock.mockReturnValue({
      title: "Example Article",
      content: `<article><p>${"A".repeat(300)}</p></article>`,
      textContent: "A".repeat(300),
    });

    const response = await extractArticle({
      url: "https://example.com/source",
    });

    expect(response).toEqual({
      status: "blocked",
      finalUrl: "https://example.com/final",
      errorCode: "ANTI_BOT_PAGE",
      errorMessage: "Rendered page still appears blocked",
    });
    expect(extractReadableArticleMock).not.toHaveBeenCalled();
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("returns blocked when readability extracts challenge content from a benign shell", async () => {
    const { page, browser } = createBrowserDouble();
    launchBrowserMock.mockResolvedValue(browser);
    page.content.mockResolvedValue(
      `<html><body><main>${"Loading ".repeat(40)}</main></body></html>`,
    );
    extractReadableArticleMock.mockReturnValue({
      title: "Just a moment",
      content: `<article><p>${"Checking if the site connection is secure. ".repeat(20)}</p></article>`,
      textContent: "Checking if the site connection is secure. ".repeat(20),
    });

    const response = await extractArticle({
      url: "https://example.com/source",
    });

    expect(response).toEqual({
      status: "blocked",
      finalUrl: "https://example.com/final",
      errorCode: "ANTI_BOT_PAGE",
      errorMessage: "Rendered page still appears blocked",
    });
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("blocks heavy resource requests and keeps document requests flowing", async () => {
    const { browser, requestHandlers } = createBrowserDouble();
    launchBrowserMock.mockResolvedValue(browser);
    extractReadableArticleMock.mockReturnValue({
      title: "Example Article",
      textContent: "A".repeat(300),
      content: `<article><p>${"A".repeat(300)}</p></article>`,
    });

    await extractArticle({
      url: "https://example.com/source",
    });

    expect(requestHandlers).toHaveLength(1);

    const abort = vi.fn().mockResolvedValue(undefined);
    const proceed = vi.fn().mockResolvedValue(undefined);
    requestHandlers[0]({
      resourceType: () => "image",
      abort,
      continue: proceed,
    });

    expect(abort).toHaveBeenCalledTimes(1);
    expect(proceed).not.toHaveBeenCalled();

    const abortDocument = vi.fn().mockResolvedValue(undefined);
    const proceedDocument = vi.fn().mockResolvedValue(undefined);
    requestHandlers[0]({
      resourceType: () => "document",
      abort: abortDocument,
      continue: proceedDocument,
    });

    expect(abortDocument).not.toHaveBeenCalled();
    expect(proceedDocument).toHaveBeenCalledTimes(1);
  });

  it("returns unreadable when readability does not produce usable content", async () => {
    const { browser } = createBrowserDouble();
    launchBrowserMock.mockResolvedValue(browser);
    extractReadableArticleMock.mockReturnValue(null);

    const response = await extractArticle({
      url: "https://example.com/source",
    });

    expect(response).toEqual({
      status: "unreadable",
      finalUrl: "https://example.com/final",
      errorCode: "NO_READABLE_CONTENT",
      errorMessage: "Rendered page did not produce readable article content",
    });
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("returns unreadable when extracted content is too short", async () => {
    const { browser } = createBrowserDouble();
    launchBrowserMock.mockResolvedValue(browser);
    extractReadableArticleMock.mockReturnValue({
      title: "Short article",
      content: "<article><p>Too short</p></article>",
      textContent: "Too short",
    });

    const response = await extractArticle({
      url: "https://example.com/source",
    });

    expect(response).toEqual({
      status: "unreadable",
      finalUrl: "https://example.com/final",
      errorCode: "NO_READABLE_CONTENT",
      errorMessage: "Rendered page did not produce readable article content",
    });
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("continues extraction when waiting for selectors times out", async () => {
    const { page, browser } = createBrowserDouble();
    launchBrowserMock.mockResolvedValue(browser);
    page.waitForSelector.mockRejectedValue(new Error("Selector timeout"));
    extractReadableArticleMock.mockReturnValue({
      title: "Example Article",
      textContent: "A".repeat(300),
      content: `<article><p>${"A".repeat(300)}</p></article>`,
    });

    const response = await extractArticle({
      url: "https://example.com/source",
    });

    expect(response).toEqual({
      status: "ok",
      finalUrl: "https://example.com/final",
      title: "Example Article",
      excerpt: undefined,
      byline: undefined,
      siteName: undefined,
      lang: undefined,
      textContent: "A".repeat(300),
      htmlFragment: `<article><p>${"A".repeat(300)}</p></article>`,
    });
    expect(page.content).toHaveBeenCalledTimes(1);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("returns error and still closes the browser when page navigation fails", async () => {
    const { page, browser } = createBrowserDouble();
    launchBrowserMock.mockResolvedValue(browser);
    page.goto.mockRejectedValue(new Error("Navigation timeout"));

    const response = await extractArticle({
      url: "https://example.com/source",
    });

    expect(response).toEqual({
      status: "error",
      errorCode: "EXTRACTION_FAILED",
      errorMessage: "Navigation timeout",
    });
    expect(browser.close).toHaveBeenCalledTimes(1);
  });
});
