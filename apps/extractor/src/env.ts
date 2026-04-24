import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentFilePath = fileURLToPath(import.meta.url);
const appRoot = resolve(dirname(currentFilePath), "..");
const localEnvPath = resolve(appRoot, ".env.local");
const envPath = resolve(appRoot, ".env");

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

if (existsSync(localEnvPath)) {
  process.loadEnvFile(localEnvPath);
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  EXTRACTOR_SHARED_SECRET: z.string().min(1),
  CHROME_PATH: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Missing or invalid environment variables");
  console.error(z.treeifyError(parsed.error));
  throw new Error("Invalid environment");
}

export const env = parsed.data;
export type Env = typeof env;
