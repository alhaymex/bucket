import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  EXPO_PUBLIC_CONVEX_URL: z.string().min(1),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  EXPO_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),
});

const rawEnv = {
  NODE_ENV: __DEV__ ? "development" : "production",
  EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error("❌ Missing environment variables:");
  console.error(z.treeifyError(parsed.error));
  throw new Error("Missing environment variables");
}

export const env = parsed.data;
export type Env = typeof env;
