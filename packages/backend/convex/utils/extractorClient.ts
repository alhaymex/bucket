import {
  ExtractArticleRequestSchema,
  ExtractArticleResponseSchema,
  urlSchema,
} from "@bucket/common";
import { env } from "../../env";

export const EXTRACTOR_REQUEST_TIMEOUT_MS = 35_000;

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

  const canonicalUrl = urlSchema.parse(url);
  const payload = ExtractArticleRequestSchema.parse({
    url: canonicalUrl,
    timeoutMs: timeoutMs ?? 30_000,
  });
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    EXTRACTOR_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      new URL("/internal/extract/article", env.EXTRACTOR_BASE_URL),
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${env.EXTRACTOR_SHARED_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.headers.get("content-type")?.includes("application/json")) {
      const body = await response.text();
      throw new Error(
        `Extractor returned non-JSON response (status ${response.status}, content-type: ${response.headers.get("content-type")}): ${body.slice(0, 300)}`,
      );
    }

    const json = (await response.json()) as unknown;
    const parsed = ExtractArticleResponseSchema.parse(json);

    if (!response.ok && parsed.status === "error") {
      throw new Error(
        parsed.errorMessage ||
          `Extractor request failed with status ${response.status}`,
      );
    }

    return parsed;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Extractor request timed out");
    }

    throw error instanceof Error
      ? new Error(`Extractor request failed: ${error.message}`)
      : new Error("Extractor request failed");
  } finally {
    clearTimeout(timeout);
  }
};
