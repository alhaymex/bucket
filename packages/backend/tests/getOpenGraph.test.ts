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

const safeFetchMocks = vi.hoisted(() => ({
  fetchMetadataHtml: vi.fn(),
  fetchSmallJson: vi.fn(),
}));

vi.mock("../convex/utils/safeFetch", () => ({
  fetchMetadataHtml: safeFetchMocks.fetchMetadataHtml,
  fetchSmallJson: safeFetchMocks.fetchSmallJson,
  METADATA_FETCH_TIMEOUT_MS: 8_000,
  METADATA_MAX_REDIRECTS: 5,
  METADATA_MAX_HTML_BYTES: 1_048_576,
  OEMBED_FETCH_TIMEOUT_MS: 5_000,
  OEMBED_MAX_JSON_BYTES: 65_536,
}));

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
let youtubeOEmbedStatus = 200;
let youtubeOEmbedBody: Record<string, unknown> | null = {
  title: "oEmbed Video Title",
  author_name: "Video Author",
  thumbnail_url: "https://i.ytimg.com/vi/abc123/maxresdefault.jpg",
};
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
  safeFetchMocks.fetchMetadataHtml.mockReset();
  safeFetchMocks.fetchSmallJson.mockReset();

  upstreamStatus = 403;
  upstreamHtml =
    "<html><head><title>Just a moment...</title></head><body><h1>Just a moment...</h1></body></html>";
  youtubeOEmbedStatus = 200;
  youtubeOEmbedBody = {
    title: "oEmbed Video Title",
    author_name: "Video Author",
    thumbnail_url: "https://i.ytimg.com/vi/abc123/maxresdefault.jpg",
  };

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

  safeFetchMocks.fetchMetadataHtml.mockImplementation(async (url: string) => {
    if (upstreamStatus >= 200 && upstreamStatus < 300) {
      return {
        ok: true,
        url,
        status: upstreamStatus,
        headers: new Headers({
          "content-type": "text/html",
        }),
        text: upstreamHtml,
      };
    }

    return {
      ok: false,
      url,
      status: upstreamStatus,
      reason: "invalid_response",
    };
  });

  safeFetchMocks.fetchSmallJson.mockImplementation(async () => {
    if (youtubeOEmbedStatus >= 200 && youtubeOEmbedStatus < 300) {
      return {
        ok: true,
        url: "https://www.youtube.com/oembed",
        status: youtubeOEmbedStatus,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: youtubeOEmbedBody ? JSON.stringify(youtubeOEmbedBody) : "",
      };
    }

    return {
      ok: false,
      url: "https://www.youtube.com/oembed",
      status: youtubeOEmbedStatus,
      reason: "invalid_response",
    };
  });

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
  it("marks PDF links ready with filename title and favicon without fetching article html", async () => {
    const ctx = createTestContext();
    ctx.runQuery.mockResolvedValue({
      _id: "link_123",
      canonicalUrl:
        "https://sks.karabuk.edu.tr/yuklenen/dosyalar/126111201782731.pdf",
      renderType: "pdf",
    });

    await handleOpenGraph(ctx as any, { linkId: "link_123" });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(ctx.runMutation).toHaveBeenCalledTimes(1);
    const [, mutationArgs] = ctx.runMutation.mock.calls[0];

    expect(mutationArgs).toEqual({
      linkId: "link_123",
      title: "126111201782731",
      description: "PDF document",
      faviconUrl: "https://sks.karabuk.edu.tr/favicon.ico",
    });
    expect(mutationArgs).not.toHaveProperty("html");
  });

  it("stores favicon metadata for embed links without storing article html", async () => {
    const ctx = createTestContext();
    ctx.runQuery.mockResolvedValue({
      _id: "link_123",
      canonicalUrl: "https://youtube.com/watch?v=abc123",
      platform: "youtube",
      renderType: "embed",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
    upstreamStatus = 200;
    upstreamHtml = `
      <html>
        <head>
          <title>- YouTube</title>
          <meta property="og:title" content="- YouTube" />
          <meta property="og:description" content="Video description" />
          <meta property="og:site_name" content="YouTube" />
          <meta property="og:image" content="/thumb.jpg" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;

    await handleOpenGraph(ctx as any, { linkId: "link_123" });

    expect(safeFetchMocks.fetchMetadataHtml).toHaveBeenCalled();
    expect(safeFetchMocks.fetchSmallJson).toHaveBeenCalled();
    expect(ctx.runMutation).toHaveBeenCalledTimes(1);
    const [, mutationArgs] = ctx.runMutation.mock.calls[0];

    expect(mutationArgs).toEqual({
      linkId: "link_123",
      title: "oEmbed Video Title",
      description: "Video description",
      thumbnailUrl: "https://i.ytimg.com/vi/abc123/maxresdefault.jpg",
      faviconUrl: "https://youtube.com/favicon.ico",
      siteName: "YouTube",
    });
    expect(mutationArgs).not.toHaveProperty("html");
    expect(mutationArgs).not.toHaveProperty("embedHtml");
  });

  it("falls back to HTML title when YouTube oEmbed fails", async () => {
    const ctx = createTestContext();
    ctx.runQuery.mockResolvedValue({
      _id: "link_123",
      canonicalUrl: "https://youtube.com/watch?v=abc123",
      renderType: "embed",
      embedUrl: "https://www.youtube.com/embed/abc123",
      platform: "youtube",
    });
    youtubeOEmbedStatus = 404;
    youtubeOEmbedBody = null;
    upstreamStatus = 200;
    upstreamHtml = `
      <html>
        <head>
          <title>Example Video - YouTube</title>
          <meta property="og:title" content="Example Video" />
          <meta property="og:description" content="Video description" />
          <meta property="og:site_name" content="YouTube" />
          <meta property="og:image" content="/thumb.jpg" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;

    await handleOpenGraph(ctx as any, { linkId: "link_123" });

    const [, mutationArgs] = ctx.runMutation.mock.calls[0];

    expect(mutationArgs).toMatchObject({
      title: "Example Video",
      thumbnailUrl: "https://youtube.com/thumb.jpg",
    });
  });

  it("marks embed links ready with minimal metadata when direct fetch fails", async () => {
    const ctx = createTestContext();
    ctx.runQuery.mockResolvedValue({
      _id: "link_123",
      canonicalUrl: "https://video.example.com/watch/abc123",
      title: "Existing Video Title",
      renderType: "embed",
      embedUrl: "https://video.example.com/embed/abc123",
    });
    safeFetchMocks.fetchMetadataHtml.mockResolvedValueOnce({
      ok: false,
      url: "https://video.example.com/watch/abc123",
      reason: "timeout",
    });

    await handleOpenGraph(ctx as any, { linkId: "link_123" });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(ctx.runMutation).toHaveBeenCalledTimes(1);
    const [, mutationArgs] = ctx.runMutation.mock.calls[0];

    expect(mutationArgs).toEqual({
      linkId: "link_123",
      title: "Existing Video Title",
      faviconUrl: "https://video.example.com/favicon.ico",
    });
  });

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

  it.each([
    "unsupported_content_type",
    "response_too_large",
    "timeout",
  ] as const)(
    "uses extractor fallback when direct reader fetch fails with %s",
    async (reason) => {
      safeFetchMocks.fetchMetadataHtml.mockResolvedValueOnce({
        ok: false,
        url: "https://example.com/articles/original",
        reason,
      });
      const ctx = createTestContext();

      await handleOpenGraph(ctx as any, { linkId: "link_123" });

      expect(ctx.runMutation).toHaveBeenCalledTimes(1);
      const [, mutationArgs] = ctx.runMutation.mock.calls[0];

      expect(mutationArgs).toMatchObject({
        linkId: "link_123",
        title: "Fallback Article",
        siteName: "Example Site",
        text: "word ".repeat(450).trim(),
      });
    },
  );

  it("marks invalid canonical URLs as error without fetching metadata", async () => {
    const ctx = createTestContext();
    ctx.runQuery.mockResolvedValue({
      _id: "link_123",
      canonicalUrl: "http://127.0.0.1/admin",
      renderType: "reader",
    });

    await handleOpenGraph(ctx as any, { linkId: "link_123" });

    expect(safeFetchMocks.fetchMetadataHtml).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(ctx.runMutation).toHaveBeenCalledTimes(1);
    const [, mutationArgs] = ctx.runMutation.mock.calls[0];

    expect(mutationArgs).toEqual({
      linkId: "link_123",
    });
  });

  it("marks reader links error when direct fetch and extractor unreadable both fail", async () => {
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

    expect(mutationArgs).toEqual({
      linkId: "link_123",
    });
  });

  it("does not store extractor fallback content that still looks blocked", async () => {
    extractorResponse = {
      status: "ok",
      finalUrl: "https://example.com/articles/fallback",
      title: "Just a moment",
      excerpt: "Checking if the site connection is secure",
      siteName: "Example Site",
      textContent: "Checking if the site connection is secure. ".repeat(20),
      htmlFragment: `<article><p>${"Checking if the site connection is secure. ".repeat(20)}</p></article>`,
    };
    const ctx = createTestContext();

    await handleOpenGraph(ctx as any, { linkId: "link_123" });

    expect(ctx.runMutation).toHaveBeenCalledTimes(1);
    const [, mutationArgs] = ctx.runMutation.mock.calls[0];

    expect(mutationArgs).toEqual({
      linkId: "link_123",
    });
  });

  it("marks reader links error when direct fetch and extractor error both fail", async () => {
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

    expect(mutationArgs).toEqual({
      linkId: "link_123",
    });
  });
});
