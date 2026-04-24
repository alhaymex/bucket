export const extractorConfig = {
  puppeteer: {
    timeoutMs: 30000,
    maxConcurrency: 2,
    chromePath: undefined as string | undefined,
  },
} as const;

export type ExtractorConfig = typeof extractorConfig;
