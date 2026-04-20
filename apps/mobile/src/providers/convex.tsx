import { env } from "@/env";
import { createReactClient } from "@bucket/backend/client";
import { ConvexProvider as Provider } from "convex/react";

const client = createReactClient(env.EXPO_PUBLIC_CONVEX_URL);

export const ConvexProvider = ({ children }: { children: React.ReactNode }) => {
  return <Provider client={client}>{children}</Provider>;
};
