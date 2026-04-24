export const extractorConfig = {
  puppeteer: {
    headless: true,
    timeoutMs: 30000,
    maxConcurrency: 2,
  },
} as const;

export type ExtractorConfig = typeof extractorConfig;
