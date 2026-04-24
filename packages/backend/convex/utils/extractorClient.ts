import {
  ExtractArticleRequestSchema,
  ExtractArticleResponseSchema,
} from "@bucket/common";
import { env } from "../../env";

export const callExtractor = async ({
  url,
  timeoutMs,
}: {
  url: string;
  timeoutMs?: number;
}) => {
  if (!env.EXTRACTOR_BASE_URL || !env.EXTRACTOR_SHARED_SECRET) {
    throw new Error("Extractor fallback is not configured");
  }

  const payload = ExtractArticleRequestSchema.parse({
    url,
    timeoutMs,
  });

  const response = await fetch(
    new URL("/internal/extract/article", env.EXTRACTOR_BASE_URL),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.EXTRACTOR_SHARED_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const json = await response.json();

  return ExtractArticleResponseSchema.parse(json);
};
