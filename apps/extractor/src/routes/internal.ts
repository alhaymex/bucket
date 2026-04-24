import type { FastifyPluginAsync } from "fastify";
import { env } from "../env";
import { registerExtractArticleRoute } from "./extractArticle";

export const internalRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (request, reply) => {
    const authorization = request.headers.authorization;
    const expected = `Bearer ${env.EXTRACTOR_SHARED_SECRET}`;

    if (authorization !== expected) {
      return reply.code(401).send({
        error: "Unauthorized",
      });
    }
  });

  registerExtractArticleRoute(app);
};
