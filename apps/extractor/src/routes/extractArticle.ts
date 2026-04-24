import {
  ExtractArticleRequestSchema,
  ExtractArticleResponseSchema,
} from "@bucket/common";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

export const registerExtractArticleRoute = (app: FastifyInstance) => {
  app.post("/extract/article", async (request, reply) => {
    const parsed = ExtractArticleRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid request body",
        details: z.treeifyError(parsed.error),
      });
    }

    const response = ExtractArticleResponseSchema.parse({
      status: "error",
      errorCode: "NOT_IMPLEMENTED",
      errorMessage: "Extractor route not implemented yet",
    });

    return reply.code(501).send(response);
  });
};
