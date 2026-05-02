import { describe, expect, it } from "vitest";
import { isUrl, normalizeUrl, urlSchema } from "@bucket/common";

describe("urlSchema", () => {
  it("normalizes bare domains to HTTPS URLs", () => {
    expect(urlSchema.parse("google.com")).toBe("https://google.com/");
    expect(urlSchema.parse(" www.google.com/search?q=zod ")).toBe(
      "https://www.google.com/search?q=zod",
    );
  });

  it("preserves explicit HTTP and HTTPS schemes", () => {
    expect(urlSchema.parse("http://example.com/articles")).toBe(
      "http://example.com/articles",
    );
    expect(urlSchema.parse("HTTPS://Example.com")).toBe("https://example.com/");
  });

  it("rejects non-HTTP URL schemes", () => {
    expect(urlSchema.safeParse("ftp://example.com/file").success).toBe(false);
    expect(urlSchema.safeParse("file:///etc/passwd").success).toBe(false);
    expect(urlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });

  it("rejects localhost and private network destinations", () => {
    const blockedUrls = [
      "http://localhost",
      "http://api.local",
      "http://service.internal",
      "http://router.lan",
      "http://127.0.0.1",
      "http://10.0.0.1",
      "http://172.16.0.1",
      "http://192.168.1.1",
      "http://169.254.169.254",
      "http://[::1]/",
      "http://[fc00::1]/",
      "http://[fe80::1]/",
    ];

    for (const url of blockedUrls) {
      expect(urlSchema.safeParse(url).success, url).toBe(false);
    }
  });

  it("rejects ambiguous IPv4 forms before URL normalization", () => {
    const ambiguousUrls = [
      "http://010.0.0.1",
      "http://0300.0250.0001.0001",
      "http://0177.1",
      "http://127.1",
      "http://1.2.3",
      "http://2130706433",
      "http://0x7f000001",
      "http://0x08080808",
    ];

    for (const url of ambiguousUrls) {
      expect(urlSchema.safeParse(url).success, url).toBe(false);
    }
  });

  it("accepts public domain and public IPv4 destinations", () => {
    expect(isUrl("example.com")).toBe(true);
    expect(urlSchema.parse("https://f.com")).toBe("https://f.com/");
    expect(urlSchema.parse("http://93.184.216.34")).toBe(
      "http://93.184.216.34/",
    );
  });

  it("accepts public IPv6 destinations", () => {
    expect(urlSchema.parse("http://[2606:4700:4700::1111]/")).toBe(
      "http://[2606:4700:4700::1111]/",
    );
  });

  it("rejects IPv4-mapped private IPv6 destinations", () => {
    expect(urlSchema.safeParse("http://[::ffff:127.0.0.1]/").success).toBe(
      false,
    );
    expect(urlSchema.safeParse("http://[::ffff:10.0.0.1]/").success).toBe(
      false,
    );
  });

  it("rejects compressed IPv6 special-use destinations", () => {
    expect(urlSchema.safeParse("http://[::1:fc00:1]/").success).toBe(false);
  });

  it("rejects credentials in URLs", () => {
    expect(urlSchema.safeParse("https://user:pass@example.com").success).toBe(
      false,
    );
  });

  it("rejects single-label hostnames", () => {
    expect(urlSchema.safeParse("http://printer").success).toBe(false);
    expect(urlSchema.safeParse("printer").success).toBe(false);
  });

  it("removes trailing dots from domains", () => {
    expect(urlSchema.parse("https://example.com.")).toBe(
      "https://example.com/",
    );
  });

  it("normalizes URLs through the public URL helper", () => {
    expect(normalizeUrl("example.com/path#section")).toBe(
      "https://example.com/path",
    );
  });
});
