import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { env } from "../env";

const internalRoutesPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (request, reply) => {
    const authorization = request.headers.authorization;
    const expected = `Bearer ${env.EXTRACTOR_SHARED_SECRET}`;

    if (authorization !== expected) {
      await reply.code(401).send({
        error: "Unauthorized",
      });
    }
  });
};

export const internalRoutes = fp(internalRoutesPlugin, {
  name: "internal-routes",
});
