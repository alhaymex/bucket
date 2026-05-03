import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "puppeteer";
import { extractorConfig } from "../config";
import { env } from "../env";

puppeteer.use(StealthPlugin());

type QueueEntry = {
  resolve: () => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

class BrowserPool {
  private browser: Browser | null = null;
  private activePages = 0;
  private queue: QueueEntry[] = [];
  private launching = false;

  async launch(): Promise<void> {
    if (this.browser) return;
    if (this.launching) return;

    this.launching = true;
    try {
      this.browser = await puppeteer.launch({
        headless: extractorConfig.puppeteer.headless,
        executablePath: env.CHROME_PATH || undefined,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-dev-shm-usage",
          "--window-size=1920,1080",
        ],
      });

      this.browser.on("disconnected", () => {
        console.warn(
          "[BrowserPool] Chrome disconnected, will relaunch on next request",
        );
        this.browser = null;
      });

      console.log("[BrowserPool] Chrome launched");
    } finally {
      this.launching = false;
    }
  }

  async acquirePage(): Promise<Page> {
    if (!this.browser) {
      await this.launch();
    }

    const { maxConcurrency, queueTimeoutMs } = extractorConfig.puppeteer;

    if (this.activePages < maxConcurrency) {
      return this.createPage();
    }

    return new Promise<Page>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.queue.findIndex((e) => e.resolve === onSlotFree);
        if (idx !== -1) this.queue.splice(idx, 1);
        reject(
          new Error(
            `Extraction queue timeout: all ${maxConcurrency} slots busy for ${queueTimeoutMs}ms`,
          ),
        );
      }, queueTimeoutMs);

      const onSlotFree = () => {
        clearTimeout(timer);
        this.createPage().then(resolve).catch(reject);
      };

      const entry: QueueEntry = { resolve: onSlotFree, reject, timer };
      this.queue.push(entry);
    });
  }

  async releasePage(page: Page): Promise<void> {
    try {
      await page.close();
    } catch {
      // Page may already be closed if navigation crashed
    }

    this.activePages--;

    const next = this.queue.shift();
    if (next) {
      clearTimeout(next.timer);
      next.resolve();
    }
  }

  async shutdown(): Promise<void> {
    for (const entry of this.queue) {
      clearTimeout(entry.timer);
      entry.reject(new Error("Browser pool shutting down"));
    }
    this.queue = [];

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.activePages = 0;
      console.log("[BrowserPool] Chrome shut down");
    }
  }

  status() {
    return {
      browser: this.browser ? "connected" : "disconnected",
      activePages: this.activePages,
      queuedRequests: this.queue.length,
      maxConcurrency: extractorConfig.puppeteer.maxConcurrency,
    };
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error("Browser not launched");
    }

    this.activePages++;

    const page = await this.browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );

    return page;
  }
}

export const browserPool = new BrowserPool();
