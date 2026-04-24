import puppeteer from "puppeteer";
import { extractorConfig } from "../config";
import { env } from "../env";

export const launchBrowser = async () => {
  return puppeteer.launch({
    headless: extractorConfig.puppeteer.headless,
    executablePath: env.CHROME_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
};
