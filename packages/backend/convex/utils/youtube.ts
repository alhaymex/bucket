"use node";

import {
  fetchSmallJson,
  METADATA_MAX_REDIRECTS,
  OEMBED_FETCH_TIMEOUT_MS,
  OEMBED_MAX_JSON_BYTES,
} from "./safeFetch";

const YOUTUBE_OEMBED_URL = "https://www.youtube.com/oembed";
const OEMBED_ALLOWED_CONTENT_TYPES = [
  "application/json",
  "application/json; charset=utf-8",
  "text/json",
];

type YouTubeOEmbedResponse = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

export const fetchYouTubeOEmbed = async ({
  canonicalUrl,
}: {
  canonicalUrl: string;
}) => {
  const endpoint = new URL(YOUTUBE_OEMBED_URL);
  endpoint.searchParams.set("url", canonicalUrl);
  endpoint.searchParams.set("format", "json");

  try {
    const response = await fetchSmallJson({
      url: endpoint.toString(),
      timeoutMs: OEMBED_FETCH_TIMEOUT_MS,
      maxBytes: OEMBED_MAX_JSON_BYTES,
      maxRedirects: METADATA_MAX_REDIRECTS,
      allowedContentTypes: OEMBED_ALLOWED_CONTENT_TYPES,
      userAgent: "Mozilla/5.0",
    });

    if (!response.ok) {
      return null;
    }

    const json = JSON.parse(response.text) as YouTubeOEmbedResponse;

    return {
      title: json.title,
      authorName: json.author_name,
      thumbnailUrl: json.thumbnail_url,
    };
  } catch {
    return null;
  }
};
