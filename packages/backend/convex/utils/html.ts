import * as cheerio from "cheerio";
import sanitizeHtml, { type IOptions } from "sanitize-html";

type TransformTagName = Parameters<
  NonNullable<IOptions["transformTags"]>[string]
>[0];

type TransformTagAttributes = Parameters<
  NonNullable<IOptions["transformTags"]>[string]
>[1];

const READING_TIME_PATTERN =
  /^\s*(?:\d+|[a-z]+)\s*(?:-|to\s+)?\s*\d*\s*min(?:ute)?s?\s+read\s*$/i;

const LINK_TO_HEADING_PATTERN = /^\s*link to heading\s*$/i;

const sanitizeSrcSet = (value: string, baseUrl: string) => {
  const candidates = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [url, descriptor] = part.split(/\s+/, 2);
      const absoluteUrl = absolutizeUrl(url, baseUrl);

      if (!absoluteUrl) return undefined;

      return descriptor ? `${absoluteUrl} ${descriptor}` : absoluteUrl;
    })
    .filter((part): part is string => Boolean(part));

  return candidates.length > 0 ? candidates.join(", ") : undefined;
};

const absolutizeUrl = (value: string, baseUrl: string) => {
  if (!value.trim()) return undefined;

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
};

const BASE_ALLOWED_TAGS = [
  "article",
  "section",
  "div",
  "p",
  "span",
  "br",
  "hr",
  "blockquote",
  "pre",
  "code",
  "em",
  "strong",
  "b",
  "i",
  "u",
  "s",
  "sub",
  "sup",
  "mark",
  "small",
  "cite",
  "q",
  "time",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "colgroup",
  "col",
  "a",
  "img",
] as const;

const BASE_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "target", "rel", "title", "id"],
  img: ["src", "srcset", "sizes", "alt", "title", "width", "height"],
  th: ["colspan", "rowspan", "scope"],
  td: ["colspan", "rowspan"],
  time: ["datetime"],
  blockquote: ["cite"],
  q: ["cite"],
  "*": ["lang", "dir", "id"],
};

const sanitizeBaseArticleHtml = ({
  html,
  baseUrl,
}: {
  html: string;
  baseUrl: string;
}) =>
  sanitizeHtml(html, {
    allowedTags: [...BASE_ALLOWED_TAGS],
    allowedAttributes: BASE_ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src", "cite"],
    allowProtocolRelative: false,
    parser: {
      lowerCaseTags: false,
    },
    transformTags: {
      a: (tagName: TransformTagName, attribs: TransformTagAttributes) => {
        const href = attribs.href
          ? absolutizeUrl(attribs.href, baseUrl)
          : undefined;

        return {
          tagName,
          attribs: {
            ...(href ? { href } : {}),
            ...(attribs.title ? { title: attribs.title } : {}),
            ...(attribs.id ? { id: attribs.id } : {}),
            target:
              attribs.target === "_blank" || attribs.target === "_self"
                ? attribs.target
                : "_self",
            rel: "noopener noreferrer",
          },
        };
      },
      img: (tagName: TransformTagName, attribs: TransformTagAttributes) => {
        const src = attribs.src ? absolutizeUrl(attribs.src, baseUrl) : undefined;
        const srcset = attribs.srcset
          ? sanitizeSrcSet(attribs.srcset, baseUrl)
          : undefined;

        return {
          tagName,
          attribs: {
            ...(src ? { src } : {}),
            ...(srcset ? { srcset } : {}),
            ...(attribs.sizes ? { sizes: attribs.sizes } : {}),
            ...(attribs.alt ? { alt: attribs.alt } : {}),
            ...(attribs.title ? { title: attribs.title } : {}),
            ...(attribs.width ? { width: attribs.width } : {}),
            ...(attribs.height ? { height: attribs.height } : {}),
          },
        };
      },
    },
    nonTextTags: ["script", "style", "textarea", "option", "noscript"],
  });

const stripPublisherChrome = ($: cheerio.CheerioAPI) => {
  $("svg").each((_, element) => {
    const $element = $(element);
    const ariaLabel = $element.attr("aria-label")?.trim().toLowerCase();
    const testId = $element.attr("data-testid")?.trim().toLowerCase();

    if (ariaLabel === "link to heading" || testId === "geist-icon") {
      $element.remove();
    }
  });

  $("a, span, p, div, li").each((_, element) => {
    const $element = $(element);
    const text = $element.text().replace(/\s+/g, " ").trim();

    if (LINK_TO_HEADING_PATTERN.test(text)) {
      $element.remove();
      return;
    }

    if (READING_TIME_PATTERN.test(text)) {
      $element.remove();
    }
  });
};

const removeEmptyNodes = ($: cheerio.CheerioAPI) => {
  $("p, div, span").each((_, element) => {
    const $element = $(element);
    const hasContentNode = $element.children().length > 0;
    const text = $element.text().replace(/\s+/g, " ").trim();

    if (!hasContentNode && !text) {
      $element.remove();
    }
  });
};

export const sanitizeArticleHtml = ({
  html,
  baseUrl,
}: {
  html: string;
  baseUrl: string;
}) => {
  const sanitizedHtml = sanitizeBaseArticleHtml({ html, baseUrl });
  const $ = cheerio.load(sanitizedHtml, null, false);

  stripPublisherChrome($);
  removeEmptyNodes($);

  return $.html();
};
