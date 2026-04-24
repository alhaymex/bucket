import Fastify from "fastify";
import { registerHealthRoutes } from "./routes/health";

export const buildServer = () => {
  const app = Fastify();

  registerHealthRoutes(app);

  return app;
};
