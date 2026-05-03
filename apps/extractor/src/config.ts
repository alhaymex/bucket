export const extractorConfig = {
  puppeteer: {
    headless: true,
    timeoutMs: 30000,
    maxConcurrency: 4,
    queueTimeoutMs: 30000,
  },
} as const;

export type ExtractorConfig = typeof extractorConfig;
