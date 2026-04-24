import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Missing or invalid environment variables");
  console.error(z.treeifyError(parsed.error));
  throw new Error("Invalid environment");
}

export const env = parsed.data;
export type Env = typeof env;
