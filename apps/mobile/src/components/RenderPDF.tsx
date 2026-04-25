import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";
import { useColors } from "@/hooks/useColors";

type PDFViewProps = {
  url: string;
};

export function PDFView({ url }: PDFViewProps) {
  const colors = useColors();

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ uri: url }}
      javaScriptEnabled
      domStorageEnabled
      style={{ backgroundColor: colors.background }}
      startInLoadingState
      onShouldStartLoadWithRequest={(request) => isHttpUrl(request.url)}
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
