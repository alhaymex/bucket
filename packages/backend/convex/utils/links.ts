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

const getXCanonicalPath = (url: URL) => {
  const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)/);

  if (!match) return undefined;

  return `/${match[1]}/status/${match[2]}`;
};

const getInstagramPost = (url: URL) => {
  const match = url.pathname.match(/^\/(p|reel|tv)\/([^/?#]+)/);

  if (!match) return undefined;

  return {
    kind: match[1],
    shortcode: match[2],
  };
};

const getTikTokPostId = (url: URL) => {
  const playerMatch = url.pathname.match(/^\/player\/v1\/(\d+)/);

  if (playerMatch) return playerMatch[1];

  return url.pathname.match(/^\/@[^/]+\/(?:video|photo)\/(\d+)/)?.[1];
};

const getTikTokCanonicalPath = (url: URL) => {
  const match = url.pathname.match(/^\/(@[^/]+)\/(video|photo)\/(\d+)/);

  if (!match) return undefined;

  return `/${match[1]}/${match[2]}/${match[3]}`;
};

const getRedditPostId = (url: URL) => {
  return url.pathname.match(/\/comments\/([a-z0-9]+)/i)?.[1];
};

const isFacebookVideoUrl = (url: URL) => {
  return (
    /\/videos\//.test(url.pathname) ||
    url.pathname === "/watch/" ||
    url.pathname === "/watch" ||
    url.searchParams.has("v") ||
    normalizeHost(url.hostname) === "fb.watch"
  );
};

const isFacebookPostUrl = (url: URL) => {
  return (
    /\/posts\/\d+/.test(url.pathname) ||
    url.pathname === "/permalink.php" ||
    url.pathname === "/story.php" ||
    url.searchParams.has("story_fbid") ||
    url.searchParams.has("fbid")
  );
};

const getFacebookExternalId = (url: URL) => {
  const pathVideoId = url.pathname.match(/\/videos\/(\d+)/)?.[1];
  const postId = url.pathname.match(/\/posts\/(\d+)/)?.[1];

  return (
    pathVideoId ??
    postId ??
    url.searchParams.get("v") ??
    url.searchParams.get("story_fbid") ??
    url.searchParams.get("fbid") ??
    undefined
  );
};

export const analyzeUrl = (url: string) => {
  const parsed = new URL(url);
  const sourceHost = normalizeHost(parsed.hostname);
  const platform = getPlatform(url);

  parsed.hash = "";

  const isEmbed = platform in EMBED_HOSTS;
  const isProduct = platform in PRODUCT_HOSTS;
  const isFacebookVideo = platform === "facebook" && isFacebookVideoUrl(parsed);
  const isFacebookPost = platform === "facebook" && isFacebookPostUrl(parsed);

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
      canonicalUrl = `https://x.com${
        getXCanonicalPath(parsed) ?? `/i/web/status/${externalId}`
      }`;
    }
  }

  if (platform === "instagram") {
    const post = getInstagramPost(parsed);

    if (post) {
      externalId = post.shortcode;
      canonicalUrl = `https://www.instagram.com/${post.kind}/${post.shortcode}/`;
      embedUrl = `https://www.instagram.com/${post.kind}/${post.shortcode}/embed`;
    }
  }

  if (platform === "tiktok") {
    externalId = getTikTokPostId(parsed);

    if (externalId) {
      const canonicalPath = getTikTokCanonicalPath(parsed);

      canonicalUrl = canonicalPath
        ? `https://www.tiktok.com${canonicalPath}`
        : `https://www.tiktok.com/player/v1/${externalId}`;
      embedUrl = `https://www.tiktok.com/player/v1/${externalId}`;
    }
  }

  if (platform === "reddit") {
    externalId = getRedditPostId(parsed);
    canonicalUrl = `https://www.reddit.com${parsed.pathname}`;
  }

  if (platform === "facebook") {
    externalId = getFacebookExternalId(parsed);
    canonicalUrl = parsed.toString();

    if (isFacebookVideo) {
      embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        canonicalUrl,
      )}&show_text=false&width=500`;
    } else if (isFacebookPost) {
      embedUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
        canonicalUrl,
      )}&show_text=true&width=500`;
    }
  }

  return {
    canonicalUrl,
    sourceHost,
    platform,
    renderType: isEmbed ? "embed" : "reader",
    contentType:
      platform === "youtube" || platform === "tiktok" || isFacebookVideo
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
