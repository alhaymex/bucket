import dns from "node:dns";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMetadataHtml,
  isPublicResolvedAddress,
  safeFetchTextWithFetcher,
} from "../convex/utils/safeFetch";

const createArgs = (
  overrides: Partial<Parameters<typeof safeFetchTextWithFetcher>[0]> = {},
) => ({
  url: "https://example.com/article",
  timeoutMs: 1_000,
  maxBytes: 1_024,
  maxRedirects: 5,
  allowedContentTypes: ["text/html", "application/xhtml+xml"],
  ...overrides,
});

describe("safeFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchMetadataHtml rejects private IPv4 DNS results", async () => {
    vi.spyOn(dns, "lookup").mockImplementation(((
      hostname: string,
      options: unknown,
      callback: unknown,
    ) => {
      const lookupCallback = (
        typeof options === "function" ? options : callback
      ) as (error: Error | null, addresses: dns.LookupAddress[]) => void;

      lookupCallback(null, [{ address: "10.0.0.1", family: 4 }]);
    }) as typeof dns.lookup);

    const result = await fetchMetadataHtml("http://example.com/");

    expect(result).toMatchObject({
      ok: false,
      reason: "blocked_ip",
    });
  });

  it("rejects IPv4-mapped private IPv6 DNS results", () => {
    expect(isPublicResolvedAddress("::ffff:127.0.0.1")).toBe(false);
    expect(isPublicResolvedAddress("::ffff:10.0.0.1")).toBe(false);
  });

  it("rejects localhost and private hostnames before fetch", async () => {
    const fetcher = vi.fn();

    const localhost = await safeFetchTextWithFetcher(
      createArgs({ url: "http://localhost/" }),
      fetcher,
    );
    const privateIp = await safeFetchTextWithFetcher(
      createArgs({ url: "http://127.0.0.1/" }),
      fetcher,
    );

    expect(localhost).toMatchObject({
      ok: false,
      reason: "blocked_hostname",
    });
    expect(privateIp).toMatchObject({
      ok: false,
      reason: "blocked_hostname",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects unsupported content type such as application/pdf", async () => {
    const result = await safeFetchTextWithFetcher(
      createArgs(),
      async () =>
        new Response("pdf", {
          headers: { "content-type": "application/pdf" },
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "unsupported_content_type",
    });
  });

  it("rejects missing content type for direct HTML metadata", async () => {
    const result = await safeFetchTextWithFetcher(
      createArgs(),
      async () => new Response("<html></html>"),
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "unsupported_content_type",
    });
  });

  it("accepts text/html with charset", async () => {
    const result = await safeFetchTextWithFetcher(
      createArgs(),
      async () =>
        new Response("<html></html>", {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    );

    expect(result).toMatchObject({
      ok: true,
      text: "<html></html>",
    });
  });

  it("stops reading and returns response_too_large after the byte cap", async () => {
    const result = await safeFetchTextWithFetcher(
      createArgs({ maxBytes: 5 }),
      async () =>
        new Response("123456", {
          headers: { "content-type": "text/html" },
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "response_too_large",
    });
  });

  it("returns timeout on abort", async () => {
    const result = await safeFetchTextWithFetcher(
      createArgs({ timeoutMs: 1 }),
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "timeout",
    });
  });

  it("follows relative redirects", async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url === "https://example.com/article") {
        return new Response(null, {
          status: 302,
          headers: { location: "/final" },
        });
      }

      return new Response("<html>done</html>", {
        headers: { "content-type": "text/html" },
      });
    });

    const result = await safeFetchTextWithFetcher(createArgs(), fetcher);

    expect(result).toMatchObject({
      ok: true,
      url: "https://example.com/final",
      text: "<html>done</html>",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("blocks redirect to private URL", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "http://127.0.0.1/admin" },
        }),
    );

    const result = await safeFetchTextWithFetcher(createArgs(), fetcher);

    expect(result).toMatchObject({
      ok: false,
      reason: "blocked_hostname",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns too_many_redirects after 5 redirects", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "/next" },
        }),
    );

    const result = await safeFetchTextWithFetcher(createArgs(), fetcher);

    expect(result).toMatchObject({
      ok: false,
      reason: "too_many_redirects",
    });
    expect(fetcher).toHaveBeenCalledTimes(6);
  });

  it("rejects file:// scheme", async () => {
    const fetcher = vi.fn();

    const result = await safeFetchTextWithFetcher(
      createArgs({ url: "file:///etc/passwd" }),
      fetcher,
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "invalid_url",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects ftp:// scheme", async () => {
    const fetcher = vi.fn();

    const result = await safeFetchTextWithFetcher(
      createArgs({ url: "ftp://example.com/file" }),
      fetcher,
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "invalid_url",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects javascript: scheme", async () => {
    const fetcher = vi.fn();

    const result = await safeFetchTextWithFetcher(
      createArgs({ url: "javascript:alert(1)" }),
      fetcher,
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "invalid_url",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("allows redirect to a different public domain", async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url === "https://example.com/article") {
        return new Response(null, {
          status: 301,
          headers: { location: "https://other-site.org/page" },
        });
      }

      return new Response("<html>other site</html>", {
        headers: { "content-type": "text/html" },
      });
    });

    const result = await safeFetchTextWithFetcher(createArgs(), fetcher);

    expect(result).toMatchObject({
      ok: true,
      url: "https://other-site.org/page",
      text: "<html>other site</html>",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("returns invalid_response for HTTP 404", async () => {
    const result = await safeFetchTextWithFetcher(
      createArgs(),
      async () =>
        new Response("Not Found", {
          status: 404,
          headers: { "content-type": "text/html" },
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      status: 404,
      reason: "invalid_response",
    });
  });

  it("returns invalid_response for HTTP 500", async () => {
    const result = await safeFetchTextWithFetcher(
      createArgs(),
      async () =>
        new Response("Internal Server Error", {
          status: 500,
          headers: { "content-type": "text/html" },
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      status: 500,
      reason: "invalid_response",
    });
  });

  it("returns invalid_response when redirect has no Location header", async () => {
    const result = await safeFetchTextWithFetcher(
      createArgs(),
      async () => new Response(null, { status: 302 }),
    );

    expect(result).toMatchObject({
      ok: false,
      status: 302,
      reason: "invalid_response",
    });
  });

  it("rejects private IPv6 loopback address", async () => {
    const fetcher = vi.fn();

    const result = await safeFetchTextWithFetcher(
      createArgs({ url: "http://[::1]/" }),
      fetcher,
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "blocked_hostname",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects private IPv6 unique local address", async () => {
    const fetcher = vi.fn();

    const result = await safeFetchTextWithFetcher(
      createArgs({ url: "http://[fc00::1]/" }),
      fetcher,
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "blocked_hostname",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects private IPv6 link-local address", async () => {
    const fetcher = vi.fn();

    const result = await safeFetchTextWithFetcher(
      createArgs({ url: "http://[fe80::1]/" }),
      fetcher,
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "blocked_hostname",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns ok with empty text when response body is null", async () => {
    const result = await safeFetchTextWithFetcher(createArgs(), async () => {
      const response = new Response(null, {
        headers: { "content-type": "text/html" },
      });
      return response;
    });

    expect(result).toMatchObject({
      ok: true,
      text: "",
    });
  });
});

describe("isPublicResolvedAddress", () => {
  it("accepts public IPv4 addresses", () => {
    expect(isPublicResolvedAddress("8.8.8.8")).toBe(true);
    expect(isPublicResolvedAddress("1.1.1.1")).toBe(true);
  });

  it("rejects private IPv4 addresses", () => {
    expect(isPublicResolvedAddress("10.0.0.1")).toBe(false);
    expect(isPublicResolvedAddress("172.16.0.1")).toBe(false);
    expect(isPublicResolvedAddress("192.168.1.1")).toBe(false);
    expect(isPublicResolvedAddress("127.0.0.1")).toBe(false);
  });

  it("rejects IPv4-mapped IPv6 private addresses", () => {
    expect(isPublicResolvedAddress("::ffff:127.0.0.1")).toBe(false);
    expect(isPublicResolvedAddress("::ffff:10.0.0.1")).toBe(false);
    expect(isPublicResolvedAddress("::ffff:192.168.1.1")).toBe(false);
  });

  it("rejects IPv6 loopback and private ranges", () => {
    expect(isPublicResolvedAddress("::1")).toBe(false);
    expect(isPublicResolvedAddress("fc00::1")).toBe(false);
    expect(isPublicResolvedAddress("fe80::1")).toBe(false);
  });
});
