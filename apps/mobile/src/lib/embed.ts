export type EmbedTheme = {
  background: string;
  card: string;
  foreground: string;
};

export type LinkEmbedInput = {
  title?: string | null;
  embedUrl?: string | null;
  externalId?: string | null;
  platform: string;
  canonicalUrl: string;
};

export type LinkEmbedSpec =
  | {
      type: "document";
      html: string;
    }
  | {
      type: "web";
      uri: string;
    };

export function getLinkEmbedSpec({
  colors,
  link,
}: {
  colors: EmbedTheme;
  link: LinkEmbedInput;
}): LinkEmbedSpec {
  if (link.platform === "x") {
    return {
      type: "document",
      html: createEmbedDocument({
        bodyClassName: "is-script-embed",
        body: createXEmbed(link),
        colors,
      }),
    };
  }

  if (link.platform === "reddit") {
    return {
      type: "web",
      uri: link.canonicalUrl,
    };
  }

  const iframeUrl =
    link.embedUrl ??
    getFallbackIframeUrl({
      canonicalUrl: link.canonicalUrl,
      externalId: link.externalId,
      platform: link.platform,
    });

  if (iframeUrl) {
    return {
      type: "document",
      html: createEmbedDocument({
        body: createIframe({
          className: `${link.platform}-iframe`,
          title: link.title ?? "Embedded content",
          url: iframeUrl,
        }),
        colors,
      }),
    };
  }

  return {
    type: "web",
    uri: link.canonicalUrl,
  };
}

function createXEmbed(link: LinkEmbedInput) {
  return `
    <blockquote class="twitter-tweet" data-theme="dark" data-dnt="true" align="center">
      <a href="${escapeAttribute(getXEmbedUrl(link))}">${escapeHtml(
        link.title ?? link.canonicalUrl,
      )}</a>
    </blockquote>
    <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
  `;
}

function getXEmbedUrl({ canonicalUrl, externalId }: LinkEmbedInput) {
  if (!externalId) return canonicalUrl;

  try {
    const url = new URL(canonicalUrl);
    const username = url.pathname.match(/^\/([^/]+)\/status\//)?.[1];

    if (!username) return canonicalUrl;

    return `https://twitter.com/${username}/status/${externalId}?ref_src=twsrc%5Etfw`;
  } catch {
    return canonicalUrl;
  }
}

function getFallbackIframeUrl({
  canonicalUrl,
  externalId,
  platform,
}: Pick<LinkEmbedInput, "canonicalUrl" | "externalId" | "platform">) {
  if (platform === "youtube" && externalId) {
    return `https://www.youtube.com/embed/${encodeURIComponent(externalId)}`;
  }

  if (platform === "tiktok" && externalId) {
    return `https://www.tiktok.com/player/v1/${encodeURIComponent(externalId)}`;
  }

  if (platform === "instagram") {
    return getInstagramEmbedUrl(canonicalUrl);
  }

  return undefined;
}

function getInstagramEmbedUrl(canonicalUrl: string) {
  try {
    const url = new URL(canonicalUrl);
    const match = url.pathname.match(/^\/(p|reel|tv)\/([^/]+)/);

    if (!match) return undefined;

    return `https://www.instagram.com/${match[1]}/${match[2]}/embed`;
  } catch {
    return undefined;
  }
}

function createEmbedDocument({
  body,
  bodyClassName,
  colors,
}: {
  body: string;
  bodyClassName?: string;
  colors: EmbedTheme;
}) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <style>
          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            width: 100%;
            min-height: 100%;
            background: ${colors.background};
            color: ${colors.foreground};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          body {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
          }

          iframe {
            display: block;
            width: 100%;
            max-width: 720px;
            min-height: 420px;
            margin: 0 auto;
            border: 0;
            border-radius: 12px;
            background: ${colors.card};
          }

          .is-script-embed {
            align-items: flex-start;
            padding-top: 24px;
          }

          .twitter-tweet,
          .reddit-embed-bq {
            width: 100%;
            max-width: 550px;
            margin: 0 auto !important;
          }

          .facebook-iframe {
            width: 500px;
            max-width: 100%;
            min-height: 620px;
            pointer-events: none;
          }
        </style>
      </head>
      <body${bodyClassName ? ` class="${escapeAttribute(bodyClassName)}"` : ""}>
        ${body}
      </body>
    </html>
  `;
}

function createIframe({
  className,
  title,
  url,
}: {
  className: string;
  title: string;
  url: string;
}) {
  return `<iframe class="${escapeAttribute(className)}" src="${escapeAttribute(
    url,
  )}" title="${escapeAttribute(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtml(value: string) {
  return escapeAttribute(value);
}
