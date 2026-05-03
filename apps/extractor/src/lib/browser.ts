import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { extractorConfig } from "../config";
import { env } from "../env";

puppeteer.use(StealthPlugin());

export const launchBrowser = async () => {
  return puppeteer.launch({
    headless: extractorConfig.puppeteer.headless,
    executablePath: env.CHROME_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--window-size=1920,1080",
    ],
  });
};
