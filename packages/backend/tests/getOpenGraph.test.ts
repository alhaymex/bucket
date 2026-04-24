import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

type ExtractorResponse =
  | {
      status: "ok";
      finalUrl: string;
      title?: string;
      excerpt?: string;
      siteName?: string;
      textContent?: string;
      htmlFragment: string;
    }
  | {
      status: "unreadable";
      finalUrl?: string;
      errorCode: string;
      errorMessage: string;
    }
  | {
      status: "error";
      errorCode: string;
      errorMessage: string;
    };

const originalFetch = globalThis.fetch.bind(globalThis);

let extractorBaseUrl = "";
let extractorResponse: ExtractorResponse = {
  status: "ok",
  finalUrl: "https://example.com/articles/fallback",
  title: "Fallback Article",
  excerpt: "Fallback excerpt",
  siteName: "Example Site",
  textContent: "word ".repeat(450).trim(),
  htmlFragment:
    '<article><p>Fallback body</p><script>alert("x")</script><a href="/next">Next</a></article>',
};
let upstreamStatus = 403;
let upstreamHtml =
  "<html><head><title>Just a moment...</title></head><body><h1>Just a moment...</h1></body></html>";
let handleOpenGraph: typeof import("../convex/links/actions").handleOpenGraph;
let closeExtractorServer: (() => Promise<void>) | undefined;

const createTestContext = () => {
  const runQuery = vi.fn().mockResolvedValue({
    _id: "link_123",
    canonicalUrl: "https://example.com/articles/original",
    renderType: "reader",
  });
  const runMutation = vi.fn().mockResolvedValue(undefined);

  return { runQuery, runMutation };
};

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.CLERK_WEBHOOK_SIGNING_SECRET = "test-clerk-secret";
  process.env.EXTRACTOR_SHARED_SECRET = "test-secret";

  vi.resetModules();
  const { buildServer } = await import("../../../apps/extractor/src/server");
  const app = buildServer({
    extractArticleHandler: async () => extractorResponse as any,
  });

  extractorBaseUrl = await app.listen({
    host: "127.0.0.1",
    port: 0,
  });
  closeExtractorServer = async () => {
    await app.close();
  };

  process.env.EXTRACTOR_BASE_URL = extractorBaseUrl;

  vi.resetModules();
  ({ handleOpenGraph } = await import("../convex/links/actions"));
});

afterAll(async () => {
  await closeExtractorServer?.();
});

beforeEach(() => {
  upstreamStatus = 403;
  upstreamHtml =
    "<html><head><title>Just a moment...</title></head><body><h1>Just a moment...</h1></body></html>";

  extractorResponse = {
    status: "ok",
    finalUrl: "https://example.com/articles/fallback",
    title: "Fallback Article",
    excerpt: "Fallback excerpt",
    siteName: "Example Site",
    textContent: "word ".repeat(450).trim(),
    htmlFragment:
      '<article><p>Fallback body</p><script>alert("x")</script><a href="/next">Next</a></article>',
  };

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (url.startsWith(extractorBaseUrl)) {
      return originalFetch(input as RequestInfo | URL, init);
    }

    return new Response(upstreamHtml, {
      status: upstreamStatus,
      headers: {
        "content-type": "text/html",
      },
    });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getOpenGraph fallback path", () => {
  it("calls the extractor when direct fetch is blocked and stores sanitized fallback content", async () => {
    const ctx = createTestContext();

    await handleOpenGraph(ctx as any, { linkId: "link_123" });

    expect(globalThis.fetch).toHaveBeenCalled();
    expect(
      vi.mocked(globalThis.fetch).mock.calls.some(([input]) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        return url.startsWith(extractorBaseUrl);
      }),
    ).toBe(true);

    expect(ctx.runMutation).toHaveBeenCalledTimes(1);
    const [, mutationArgs] = ctx.runMutation.mock.calls[0];

    expect(mutationArgs).toMatchObject({
      linkId: "link_123",
      title: "Fallback Article",
      description: "Fallback excerpt",
      siteName: "Example Site",
      text: "word ".repeat(450).trim(),
      readingTime: 2,
    });
    expect(mutationArgs.html).toContain("<article>");
    expect(mutationArgs.html).not.toContain("<script");
    expect(mutationArgs.html).toContain('href="https://example.com/next"');
  });

  it("handles extractor unreadable responses without storing broken fallback html", async () => {
    extractorResponse = {
      status: "unreadable",
      finalUrl: "https://example.com/articles/fallback",
      errorCode: "NO_READABLE_CONTENT",
      errorMessage: "Rendered page did not produce readable article content",
    };
    const ctx = createTestContext();

    await handleOpenGraph(ctx as any, { linkId: "link_123" });

    expect(ctx.runMutation).toHaveBeenCalledTimes(1);
    const [, mutationArgs] = ctx.runMutation.mock.calls[0];

    expect(mutationArgs).toMatchObject({
      linkId: "link_123",
      html: undefined,
      text: undefined,
      readingTime: undefined,
    });
  });

  it("handles extractor error responses without throwing and without storing fallback html", async () => {
    extractorResponse = {
      status: "error",
      errorCode: "EXTRACTION_FAILED",
      errorMessage: "Navigation timeout",
    };
    const ctx = createTestContext();

    await expect(
      handleOpenGraph(ctx as any, { linkId: "link_123" }),
    ).resolves.toBeUndefined();

    expect(ctx.runMutation).toHaveBeenCalledTimes(1);
    const [, mutationArgs] = ctx.runMutation.mock.calls[0];

    expect(mutationArgs).toMatchObject({
      linkId: "link_123",
      html: undefined,
      text: undefined,
      readingTime: undefined,
    });
  });
});
