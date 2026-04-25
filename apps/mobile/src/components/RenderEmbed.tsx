import { useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";
import { useColors } from "@/hooks/useColors";
import { getLinkEmbedSpec } from "@/lib/embed";

type EmbedViewProps = {
  title?: string;
  embedUrl?: string | null;
  externalId?: string | null;
  platform: string;
  canonicalUrl: string;
};

export function EmbedView({
  title,
  embedUrl,
  externalId,
  platform,
  canonicalUrl,
}: EmbedViewProps) {
  const colors = useColors();

  const spec = useMemo(
    () =>
      getLinkEmbedSpec({
        colors,
        link: {
          canonicalUrl,
          embedUrl,
          externalId,
          platform,
          title,
        },
      }),
    [canonicalUrl, colors, embedUrl, externalId, platform, title],
  );

  return (
    <WebView
      originWhitelist={["*"]}
      source={
        spec.type === "document"
          ? { html: spec.html, baseUrl: canonicalUrl }
          : { uri: spec.uri }
      }
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      onShouldStartLoadWithRequest={(request) => {
        return isHttpUrl(request.url);
      }}
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

function isHttpUrl(url: string) {
  return (
    url === "about:blank" ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
}
