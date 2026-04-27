const YOUTUBE_OEMBED_URL = "https://www.youtube.com/oembed";

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
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) return null;

    const json = (await response.json()) as YouTubeOEmbedResponse;

    console.log("[DEBUG] youtube oEmbed response", json);

    return {
      title: json.title,
      authorName: json.author_name,
      thumbnailUrl: json.thumbnail_url,
    };
  } catch {
    return null;
  }
};
