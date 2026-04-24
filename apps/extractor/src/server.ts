import Fastify from "fastify";
import { registerHealthRoutes } from "./routes/health";
import { internalRoutes } from "./routes/internal";

export const buildServer = () => {
  const app = Fastify();

  registerHealthRoutes(app);
  
  app.register(internalRoutes, {
    prefix: "/internal",
  });

  return app;
};
