import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  EXPO_PUBLIC_CONVEX_URL: z.string(),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Missing environment variables:");
  console.error(z.treeifyError(parsed.error));
  throw new Error("Missing environment variables");
}

export const env = parsed.data;
export type Env = typeof env;
