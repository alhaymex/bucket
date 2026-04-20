import { ConvexProvider, ConvexReactClient } from "convex/react";

export const createReactClient = (url: string) => {
  return new ConvexReactClient(url);
};

export const Provider = ConvexProvider;