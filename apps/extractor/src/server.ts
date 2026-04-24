import Fastify from "fastify";
import type { internalRoutes } from "./routes/internal";
import { registerHealthRoutes } from "./routes/health";
import { internalRoutes as internalRoutesPlugin } from "./routes/internal";

type BuildServerOptions = {
  extractArticleHandler?: Parameters<typeof internalRoutes>[1]["extractArticleHandler"];
};

export const buildServer = (options: BuildServerOptions = {}) => {
  const app = Fastify();

  registerHealthRoutes(app);

  app.register(internalRoutesPlugin, {
    prefix: "/internal",
    extractArticleHandler: options.extractArticleHandler,
  });

  return app;
};
