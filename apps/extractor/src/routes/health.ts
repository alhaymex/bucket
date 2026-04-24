import type { FastifyInstance } from "fastify";

export const registerHealthRoutes = (app: FastifyInstance) => {
  app.get("/healthz", async () => {
    return { ok: true };
  });
};
