import type { FastifyInstance } from "fastify";
import { browserPool } from "../lib/browserPool";

export const registerHealthRoutes = (app: FastifyInstance) => {
  app.get("/healthz", async () => {
    const pool = browserPool.status();

    return {
      ok: pool.browser === "connected",
      ...pool,
    };
  });
};
