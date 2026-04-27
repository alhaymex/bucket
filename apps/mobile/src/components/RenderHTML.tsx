import { useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";
import { useColors } from "@/hooks/useColors";

type ReaderWebViewProps = {
  title?: string;
  html?: string | null;
  canonicalUrl: string;
};

export function ReaderHTML({ title, html, canonicalUrl }: ReaderWebViewProps) {
  const colors = useColors();

  const document = useMemo(() => {
    const body = html ?? "<p>No content available.</p>";

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
            :root {
              color-scheme: light dark;
            }

            * {
              box-sizing: border-box;
            }

            html {
              margin: 0;
              padding: 0;
              background: ${colors.background};
            }

            body {
              margin: 0;
              min-height: 100vh;
              padding: 28px 20px 48px;
              background:
                linear-gradient(180deg, ${colors.background} 0%, ${colors.muted} 100%);
              color: ${colors.foreground};
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              font-size: 18px;
              line-height: 1.7;
              text-rendering: optimizeLegibility;
              -webkit-font-smoothing: antialiased;
              overflow-wrap: break-word;
            }

            article,
            #readability-page-1,
            .page {
              max-width: 44rem;
              margin: 0 auto;
            }

            h1, h2, h3, h4, h5, h6 {
              color: ${colors.foreground};
              line-height: 1.18;
              letter-spacing: -0.03em;
              margin: 1.4em 0 0.65em;
            }

            h1 {
              margin-top: 0;
              font-size: 2rem;
              font-weight: 800;
            }

            h2 {
              font-size: 1.5rem;
              font-weight: 760;
            }

            h3 {
              font-size: 1.2rem;
              font-weight: 700;
            }

            p,
            ul,
            ol,
            blockquote,
            figure,
            pre,
            table {
              margin: 0 0 1.1em;
            }

            p,
            li,
            td,
            th {
              color: ${colors.foreground};
            }

            ul,
            ol {
              padding-left: 1.35em;
            }

            li + li {
              margin-top: 0.45em;
            }

            a {
              color: ${colors.accent};
              text-decoration: none;
              pointer-events: none;
              cursor: default;
            }

            a[href^="#"] {
              color: inherit;
            }

            a svg,
            a span:first-child:last-child,
            [data-testid="geist-icon"] {
              display: none !important;
            }

            img,
            video {
              display: block;
              max-width: 100%;
              height: auto;
              margin: 1.25em 0;
              border: 1px solid ${colors.border};
              border-radius: 18px;
              background: ${colors.muted};
            }

            figure {
              margin-left: 0;
              margin-right: 0;
            }

            figcaption {
              margin-top: 0.7em;
              color: ${colors.mutedForeground};
              font-size: 0.9rem;
            }

            hr {
              border: 0;
              border-top: 1px solid ${colors.border};
              margin: 2em 0;
            }

            blockquote {
              margin-left: 0;
              padding: 0.95em 1.05em;
              border-left: 3px solid ${colors.primary};
              border-radius: 0 16px 16px 0;
              background: ${colors.card};
              color: ${colors.mutedForeground};
            }

            pre,
            code {
              word-break: break-word;
              font-family: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace;
            }

            pre {
              overflow-x: auto;
              padding: 16px 18px;
              border: 1px solid ${colors.border};
              border-radius: 18px;
              background: ${colors.card};
              color: ${colors.foreground};
              font-size: 0.84rem;
              line-height: 1.6;
              white-space: pre;
              -webkit-overflow-scrolling: touch;
            }

            code {
              font-size: 0.9em;
            }

            p code,
            li code,
            td code,
            th code {
              padding: 0.18em 0.42em;
              border-radius: 8px;
              background: ${colors.primarySubtle};
              color: ${colors.primaryForeground};
            }

            pre code {
              padding: 0;
              background: transparent;
              color: inherit;
              white-space: inherit;
            }

            table {
              display: block;
              width: 100%;
              overflow-x: auto;
              border-collapse: collapse;
              -webkit-overflow-scrolling: touch;
            }

            thead {
              background: ${colors.card};
            }

            th,
            td {
              min-width: 120px;
              padding: 10px 12px;
              border: 1px solid ${colors.border};
              text-align: left;
              vertical-align: top;
            }

            th {
              color: ${colors.foreground};
              font-weight: 700;
            }

            tr:nth-child(even) td {
              background: ${colors.muted};
            }

            time,
            small {
              color: ${colors.mutedForeground};
            }

            .link-heading,
            .anchor,
            [aria-label="Link to heading"] {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${title ? `<h1>${escapeHtml(title)}</h1>` : ""}
          ${body}
        </body>
      </html>
    `;
  }, [colors, html, title]);

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: document, baseUrl: canonicalUrl }}
      javaScriptEnabled={false}
      style={{ backgroundColor: colors.background }}
      startInLoadingState
      renderLoading={() => (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    />
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
