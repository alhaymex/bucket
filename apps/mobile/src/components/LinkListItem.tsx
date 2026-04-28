import { useColors } from "@/hooks/useColors";
import { timeAgo } from "@/lib/date";
import {
  Code,
  FileText,
  MessageCircle,
  Newspaper,
  Play,
  ShoppingBag,
} from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

// TODO: use the favicon instead of an icon

type LinkContentType =
  | "youtube"
  | "article"
  | "product"
  | "tweet"
  | "github"
  | "generic";

type LinkListItemProps = {
  title?: string;
  url: string;
  contentType: LinkContentType;
  lastViewedAt: number;
  onPress?: () => void;
};

const typeLabelMap: Record<LinkContentType, string> = {
  youtube: "Video",
  article: "Article",
  product: "Product",
  tweet: "Tweet",
  github: "Repo",
  generic: "Link",
};

const getTypeIcon = (type: LinkContentType, color: string) => {
  switch (type) {
    case "youtube":
      return <Play size={18} color={color} />;
    case "article":
      return <Newspaper size={18} color={color} />;
    case "product":
      return <ShoppingBag size={18} color={color} />;
    case "tweet":
      return <MessageCircle size={18} color={color} />;
    case "github":
      return <Code size={18} color={color} />;
    default:
      return <FileText size={18} color={color} />;
  }
};

const getSourceFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const LinkListItem = ({
  title,
  url,
  contentType,
  lastViewedAt,
  onPress,
}: LinkListItemProps) => {
  const token = useColors();

  const source = getSourceFromUrl(url);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-3 px-4 py-3 active:opacity-70"
    >
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bucket-secondary">
        {getTypeIcon(contentType, token.mutedForeground || "#666")}
      </View>

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="text-[15px] font-medium leading-5 text-bucket-foreground"
        >
          {title || source}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-2">
          <Text className="text-[11px] font-medium uppercase tracking-wide text-bucket-muted-foreground">
            {typeLabelMap[contentType]}
          </Text>

          <Text className="text-xs text-bucket-muted-foreground">•</Text>

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
