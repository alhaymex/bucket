import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string(),
  EXTRACTOR_BASE_URL: z.string().url().optional(),
  EXTRACTOR_SHARED_SECRET: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Missing environment variables:");
  console.error(z.treeifyError(parsed.error));
  throw new Error("Missing environment variables");
}

export const env = parsed.data;
export type Env = typeof env;
