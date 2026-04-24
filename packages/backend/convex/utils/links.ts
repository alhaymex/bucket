const EMBED_HOSTS = {
  youtube: ["youtube.com", "youtu.be"],
  x: ["x.com", "twitter.com"],
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.watch"],
  tiktok: ["tiktok.com"],
  reddit: ["reddit.com"],
} as const;

const PRODUCT_HOSTS = {
  amazon: ["amazon.com"],
  etsy: ["etsy.com"],
  walmart: ["walmart.com"],
  target: ["target.com"],
  bestbuy: ["bestbuy.com"],
} as const;

type EmbedPlatform = keyof typeof EMBED_HOSTS;
type ProductPlatform = keyof typeof PRODUCT_HOSTS;

export type Platform = EmbedPlatform | ProductPlatform | "generic";

export type RenderType = "embed" | "reader";
export type ContentType = "video" | "social" | "product" | "article";

export const normalizeHost = (host: string) => {
  return host.replace(/^www\./, "").toLowerCase();
};

const hostMatches = (host: string, hosts: readonly string[]) => {
  return hosts.some(
    (candidate) => host === candidate || host.endsWith(`.${candidate}`),
  );
};

export const getPlatform = (url: string): Platform => {
  const host = normalizeHost(new URL(url).hostname);

  for (const [platform, hosts] of Object.entries(EMBED_HOSTS)) {
    if (hostMatches(host, hosts)) {
      return platform as EmbedPlatform;
    }
  }

  for (const [platform, hosts] of Object.entries(PRODUCT_HOSTS)) {
    if (hostMatches(host, hosts)) {
      return platform as ProductPlatform;
    }
  }

  return "generic";
};

const getYouTubeVideoId = (url: URL) => {
  const host = normalizeHost(url.hostname);

  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0];
  }

  if (hostMatches(host, EMBED_HOSTS.youtube)) {
    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/").filter(Boolean)[1];
    }

    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/").filter(Boolean)[1];
    }

    return url.searchParams.get("v") ?? undefined;
  }

  return undefined;
};

const getXPostId = (url: URL) => {
  return url.pathname.match(/\/status\/(\d+)/)?.[1];
};

export const analyzeUrl = (url: string) => {
  const parsed = new URL(url);
  const sourceHost = normalizeHost(parsed.hostname);
  const platform = getPlatform(url);

  parsed.hash = "";

  const isEmbed = platform in EMBED_HOSTS;
  const isProduct = platform in PRODUCT_HOSTS;

  let canonicalUrl = parsed.toString();
  let externalId: string | undefined;
  let embedUrl: string | undefined;

  if (platform === "youtube") {
    externalId = getYouTubeVideoId(parsed);

    if (externalId) {
      canonicalUrl = `https://youtube.com/watch?v=${externalId}`;
      embedUrl = `https://www.youtube.com/embed/${externalId}`;
    }
  }

  if (platform === "x") {
    externalId = getXPostId(parsed);

    if (externalId) {
      canonicalUrl = `https://x.com${parsed.pathname}`;
    }
  }

  return {
    canonicalUrl,
    sourceHost,
    platform,
    renderType: isEmbed ? "embed" : "reader",
    contentType:
      platform === "youtube"
        ? "video"
        : isEmbed
          ? "social"
          : isProduct
            ? "product"
            : "article",
    externalId,
    embedUrl,
  } satisfies {
    canonicalUrl: string;
    sourceHost: string;
    platform: Platform;
    renderType: RenderType;
    contentType: ContentType;
    externalId?: string;
    embedUrl?: string;
  };
};
