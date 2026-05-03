import { env } from "./env";
import { browserPool } from "./lib/browserPool";
import { buildServer } from "./server";

const app = buildServer();

const shutdown = async () => {
  await app.close();
  await browserPool.shutdown();
};

const start = async () => {
  try {
    await browserPool.launch();

    const address = await app.listen({
      host: "0.0.0.0",
      port: env.PORT,
    });

    console.log(`Extractor listening on ${address}`);
  } catch (error) {
    console.error("Failed to start extractor", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});

void start();
