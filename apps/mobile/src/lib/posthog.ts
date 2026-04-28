import PostHog from "posthog-react-native";
import Constants from "expo-constants";

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as
  | string
  | undefined;
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const isPostHogConfigured = Boolean(apiKey);

if (__DEV__ && !isPostHogConfigured) {
  console.warn(
    "PostHog project token not configured. Analytics will be disabled. " +
      "Set POSTHOG_PROJECT_TOKEN in .env.local to enable analytics.",
  );
}

export const posthog = new PostHog(apiKey ?? "placeholder_key", {
  host,
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  maxBatchSize: 100,
  maxQueueSize: 1000,
  preloadFeatureFlags: true,
});
