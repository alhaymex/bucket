import { describe, expect, it } from "vitest";
import { analyzeUrl } from "../convex/utils/links";

describe("analyzeUrl", () => {
  it("normalizes YouTube videos to iframe embeds", () => {
    expect(analyzeUrl("https://youtu.be/abc123?t=30#watch")).toMatchObject({
      canonicalUrl: "https://youtube.com/watch?v=abc123",
      sourceHost: "youtu.be",
      platform: "youtube",
      contentType: "video",
      renderType: "embed",
      externalId: "abc123",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
  });

  it("normalizes X posts without creating an iframe embed URL", () => {
    expect(
      analyzeUrl("https://twitter.com/example/status/1234567890?s=20"),
    ).toMatchObject({
      canonicalUrl: "https://x.com/example/status/1234567890",
      sourceHost: "twitter.com",
      platform: "x",
      contentType: "social",
      renderType: "embed",
      externalId: "1234567890",
      embedUrl: undefined,
    });
  });

  it("normalizes Instagram post URLs to permalink and iframe embed URLs", () => {
    expect(
      analyzeUrl("https://www.instagram.com/reel/Cabc123/?igsh=ignored"),
    ).toMatchObject({
      canonicalUrl: "https://www.instagram.com/reel/Cabc123/",
      sourceHost: "instagram.com",
      platform: "instagram",
      contentType: "social",
      renderType: "embed",
      externalId: "Cabc123",
      embedUrl: "https://www.instagram.com/reel/Cabc123/embed",
    });
  });

  it("normalizes TikTok post URLs to player embeds", () => {
    expect(
      analyzeUrl("https://www.tiktok.com/@scout2015/video/6718335390845095173"),
    ).toMatchObject({
      canonicalUrl:
        "https://www.tiktok.com/@scout2015/video/6718335390845095173",
      sourceHost: "tiktok.com",
      platform: "tiktok",
      contentType: "video",
      renderType: "embed",
      externalId: "6718335390845095173",
      embedUrl: "https://www.tiktok.com/player/v1/6718335390845095173",
    });
  });

  it("normalizes Reddit permalinks without creating an iframe embed URL", () => {
    expect(
      analyzeUrl(
        "https://old.reddit.com/r/reactnative/comments/abc123/example_post/?utm_source=share",
      ),
    ).toMatchObject({
      canonicalUrl:
        "https://www.reddit.com/r/reactnative/comments/abc123/example_post/",
      sourceHost: "old.reddit.com",
      platform: "reddit",
      contentType: "social",
      renderType: "embed",
      externalId: "abc123",
      embedUrl: undefined,
    });
  });

  it("normalizes Facebook posts to the post plugin iframe URL", () => {
    const analyzed = analyzeUrl("https://www.facebook.com/example/posts/12345");

    expect(analyzed).toMatchObject({
      canonicalUrl: "https://www.facebook.com/example/posts/12345",
      sourceHost: "facebook.com",
      platform: "facebook",
      contentType: "social",
      renderType: "embed",
      externalId: "12345",
    });
    expect(analyzed.embedUrl).toBe(
      "https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fexample%2Fposts%2F12345&show_text=true&width=500",
    );
  });

  it("normalizes Facebook videos to the video plugin iframe URL", () => {
    const analyzed = analyzeUrl(
      "https://www.facebook.com/example/videos/67890/",
    );

    expect(analyzed).toMatchObject({
      canonicalUrl: "https://www.facebook.com/example/videos/67890/",
      sourceHost: "facebook.com",
      platform: "facebook",
      contentType: "video",
      renderType: "embed",
      externalId: "67890",
    });
    expect(analyzed.embedUrl).toBe(
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fexample%2Fvideos%2F67890%2F&show_text=false&width=500",
    );
  });

  it("does not create a Facebook post plugin URL for plain page URLs", () => {
    expect(analyzeUrl("https://www.facebook.com/example")).toMatchObject({
      canonicalUrl: "https://www.facebook.com/example",
      sourceHost: "facebook.com",
      platform: "facebook",
      contentType: "social",
      renderType: "embed",
      externalId: undefined,
      embedUrl: undefined,
    });
  });
});
