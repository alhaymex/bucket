// Dynamic Expo config — extends app.json and injects PostHog keys from environment variables.
// POSTHOG_PROJECT_TOKEN and POSTHOG_HOST must be set in .env.local (or the environment).
// Values are accessed at runtime via Constants.expoConfig?.extra?.posthogProjectToken
// @see src/lib/posthog.ts

const baseConfig = require("./app.json");

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...baseConfig.expo,
  extra: {
    ...baseConfig.expo.extra,
    posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
    posthogHost: process.env.POSTHOG_HOST,
  },
};
