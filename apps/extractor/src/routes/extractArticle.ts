import type { ExtractArticleResponse } from "@bucket/common";
import {
  ExtractArticleRequestSchema,
  ExtractArticleResponseSchema,
} from "@bucket/common";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { extractArticle } from "../lib/extractArticle";

type ExtractArticleHandler = typeof extractArticle;

export const registerExtractArticleRoute = (
  app: FastifyInstance,
  handler: ExtractArticleHandler = extractArticle,
) => {
  app.post("/extract/article", async (request, reply) => {
    const parsed = ExtractArticleRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      console.warn("[extract/article] invalid request body", {
        details: z.treeifyError(parsed.error),
      });
      return reply.code(400).send({
        error: "Invalid request body",
        details: z.treeifyError(parsed.error),
      });
    }

    const { url, timeoutMs } = parsed.data;
    console.log("[extract/article] request received", { url, timeoutMs });

    try {
      const raw = await handler(parsed.data);
      const response = ExtractArticleResponseSchema.parse(raw);
      const statusCode = getStatusCode(response);

      console.log("[extract/article] extraction complete", {
        url,
        status: response.status,
        statusCode,
        hasTitle: !!response.title,
        hasHtmlFragment: !!response.htmlFragment,
        htmlFragmentLength: response.htmlFragment?.length ?? 0,
        hasTextContent: !!response.textContent,
        textContentLength: response.textContent?.length ?? 0,
        finalUrl: response.finalUrl,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
      });

      return reply.code(statusCode).send(response);
    } catch (error) {
      console.error("[extract/article] unexpected error", {
        url,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  });
};

const getStatusCode = (response: ExtractArticleResponse) => {
  if (response.status === "ok") return 200;
  if (response.status === "blocked" || response.status === "unreadable") {
    return 422;
  }

  return 500;
};
