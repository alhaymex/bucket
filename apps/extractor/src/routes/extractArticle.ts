import type { ExtractArticleResponse } from "@bucket/common";
import { ExtractArticleRequestSchema, ExtractArticleResponseSchema } from "@bucket/common";
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
      return reply.code(400).send({
        error: "Invalid request body",
        details: z.treeifyError(parsed.error),
      });
    }

    const response = ExtractArticleResponseSchema.parse(
      await handler(parsed.data),
    );

    return reply.code(getStatusCode(response)).send(response);
  });
};

const getStatusCode = (response: ExtractArticleResponse) => {
  if (response.status === "ok") return 200;
  if (response.status === "blocked" || response.status === "unreadable") {
    return 422;
  }

  return 500;
};
