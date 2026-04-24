import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export const extractReadableArticle = ({
  html,
  url,
}: {
  html: string;
  url: string;
}) => {
  const dom = new JSDOM(html, { url });
  return new Readability(dom.window.document).parse();
};
