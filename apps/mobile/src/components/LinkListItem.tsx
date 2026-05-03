import { useColors } from "@/hooks/useColors";
import { timeAgo } from "@/lib/date";
import { Image } from "expo-image";
import { Link as LinkIcon } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

type LinkContentType =
  | "video"
  | "social"
  | "article"
  | "product"
  | "document"
  | "generic";

type LinkListItemProps = {
  title?: string;
  url: string;
  faviconUrl?: string;
  contentType: LinkContentType;
  readingTime?: number;
  lastViewedAt: number;
  onPress?: () => void;
};

const getSourceFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const Favicon = ({ faviconUrl }: { faviconUrl?: string }) => {
  const token = useColors();
  const [didFail, setDidFail] = React.useState(false);
  const shouldShowImage = Boolean(faviconUrl && !didFail);

  React.useEffect(() => {
    setDidFail(false);
  }, [faviconUrl]);

  return (
    <View className="h-10 w-10 shrink-0 items-center justify-center overflow-hidden">
      {shouldShowImage ? (
        <Image
          source={{ uri: faviconUrl }}
          contentFit="contain"
          transition={120}
          onError={() => setDidFail(true)}
          style={{ height: 24, width: 24 }}
        />
      ) : (
        <LinkIcon size={20} color={token.mutedForeground ?? "#666"} />
      )}
    </View>
  );
};

export const LinkListItem = ({
  title,
  url,
  faviconUrl,
  contentType,
  readingTime,
  lastViewedAt,
  onPress,
}: LinkListItemProps) => {
  const source = getSourceFromUrl(url);
  const readingTimeLabel =
    readingTime === undefined
      ? undefined
      : `${Math.max(1, Math.round(readingTime))} min`;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-3 px-4 py-3 active:opacity-70"
    >
      <Favicon faviconUrl={faviconUrl} />

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="text-[15px] font-medium leading-5 text-bucket-foreground"
        >
          {title || source}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-2">
          <Text className="text-[11px] font-medium uppercase tracking-wide text-bucket-muted-foreground">
            {contentType.toUpperCase()}
          </Text>

          <Text className="text-xs text-bucket-muted-foreground">•</Text>

          {readingTimeLabel && (
            <>
              <Text className="shrink-0 text-sm text-bucket-muted-foreground">
                {readingTimeLabel}
              </Text>

              <Text className="text-xs text-bucket-muted-foreground">•</Text>
            </>
          )}

          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 text-sm text-bucket-muted-foreground"
          >
            {source}
          </Text>

          <Text className="shrink-0 text-sm text-bucket-muted-foreground">
            {timeAgo(lastViewedAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
