import type { FastifyPluginAsync } from "fastify";
import { env } from "../env";
import { registerExtractArticleRoute } from "./extractArticle";

type InternalRoutesOptions = {
  extractArticleHandler?: Parameters<typeof registerExtractArticleRoute>[1];
};

export const internalRoutes: FastifyPluginAsync<InternalRoutesOptions> =
  async (app, options) => {
  app.addHook("onRequest", async (request, reply) => {
    const authorization = request.headers.authorization;
    const expected = `Bearer ${env.EXTRACTOR_SHARED_SECRET}`;

    if (authorization !== expected) {
      return reply.code(401).send({
        error: "Unauthorized",
      });
    }
  });

  registerExtractArticleRoute(app, options.extractArticleHandler);
};
