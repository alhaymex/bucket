import type { ExtractArticleResponse } from "@bucket/common";
import { afterEach, describe, expect, it, vi } from "vitest";

process.env.EXTRACTOR_SHARED_SECRET = "test-secret";

let buildServerPromise: Promise<typeof import("../src/server")> | null = null;

const appsUnderTest = new Set<Awaited<ReturnType<typeof createTestServer>>>();

const { statusMock } = vi.hoisted(() => ({
  statusMock: vi.fn(),
}));

vi.mock("../src/lib/browserPool", () => ({
  browserPool: {
    status: statusMock,
  },
}));

const getBuildServer = async () => {
  buildServerPromise ??= import("../src/server");

  const { buildServer } = await buildServerPromise;

  return buildServer;
};

const createTestServer = async (responseOverride?: ExtractArticleResponse) => {
  const buildServer = await getBuildServer();
  const app = buildServer({
    extractArticleHandler: async () =>
      responseOverride ?? {
        status: "ok",
        finalUrl: "https://example.com",
        title: "Example Article",
        excerpt: "Example excerpt",
        textContent: "Example article content",
        htmlFragment:
          "<article><p>This is a readable example article with enough content to pass route tests.</p></article>",
      },
  });
  await app.ready();
  appsUnderTest.add(app);
  return app;
};

afterEach(async () => {
  await Promise.all(
    [...appsUnderTest].map(async (app) => {
      appsUnderTest.delete(app);
      await app.close();
    }),
  );
});

describe("extractor HTTP routes", () => {
  it("GET /healthz is public", async () => {
    statusMock.mockReturnValue({
      browser: "connected",
      activePages: 0,
      queuedRequests: 0,
      maxConcurrency: 4,
    });

    const app = await createTestServer();

    const response = await app.inject({
      method: "GET",
      url: "/healthz",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      browser: "connected",
      activePages: 0,
      queuedRequests: 0,
      maxConcurrency: 4,
    });
  });

  it("POST /internal/extract/article requires auth", async () => {
    const app = await createTestServer();

    const response = await app.inject({
      method: "POST",
      url: "/internal/extract/article",
      payload: {
        url: "https://example.com",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "Unauthorized" });
  });

  it("POST /internal/extract/article validates the request body", async () => {
    const app = await createTestServer();

    const response = await app.inject({
      method: "POST",
      url: "/internal/extract/article",
      headers: {
        authorization: "Bearer test-secret",
      },
      payload: {
        timeoutMs: -1,
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body.error).toBe("Invalid request body");
    expect(body.details).toBeTruthy();
  });

  it("POST /internal/extract/article returns a successful extraction response", async () => {
    const app = await createTestServer();

    const response = await app.inject({
      method: "POST",
      url: "/internal/extract/article",
      headers: {
        authorization: "Bearer test-secret",
      },
      payload: {
        url: "https://example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
      finalUrl: "https://example.com",
      title: "Example Article",
      excerpt: "Example excerpt",
      textContent: "Example article content",
      htmlFragment:
        "<article><p>This is a readable example article with enough content to pass route tests.</p></article>",
    });
  });

  it("POST /internal/extract/article maps unreadable results to 422", async () => {
    const app = await createTestServer({
      status: "unreadable",
      finalUrl: "https://example.com",
      errorCode: "NO_READABLE_CONTENT",
      errorMessage: "Rendered page did not produce readable article content",
    });

    const response = await app.inject({
      method: "POST",
      url: "/internal/extract/article",
      headers: {
        authorization: "Bearer test-secret",
      },
      payload: {
        url: "https://example.com",
      },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({
      status: "unreadable",
      finalUrl: "https://example.com",
      errorCode: "NO_READABLE_CONTENT",
      errorMessage: "Rendered page did not produce readable article content",
    });
  });

  it("POST /internal/extract/article maps blocked results to 422", async () => {
    const app = await createTestServer({
      status: "blocked",
      finalUrl: "https://example.com",
      errorCode: "ANTI_BOT_PAGE",
      errorMessage: "Rendered page still appears blocked",
    });

    const response = await app.inject({
      method: "POST",
      url: "/internal/extract/article",
      headers: {
        authorization: "Bearer test-secret",
      },
      payload: {
        url: "https://example.com",
      },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({
      status: "blocked",
      finalUrl: "https://example.com",
      errorCode: "ANTI_BOT_PAGE",
      errorMessage: "Rendered page still appears blocked",
    });
  });

  it("POST /internal/extract/article maps error results to 500", async () => {
    const app = await createTestServer({
      status: "error",
      errorCode: "EXTRACTION_FAILED",
      errorMessage: "Navigation timeout",
    });

    const response = await app.inject({
      method: "POST",
      url: "/internal/extract/article",
      headers: {
        authorization: "Bearer test-secret",
      },
      payload: {
        url: "https://example.com",
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      status: "error",
      errorCode: "EXTRACTION_FAILED",
      errorMessage: "Navigation timeout",
    });
  });
});
