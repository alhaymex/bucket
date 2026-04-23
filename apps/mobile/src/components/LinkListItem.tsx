import { useColors } from "@/hooks/useColors";
import { timeAgo } from "@/lib/date";
import {
  FileText,
  Play,
  ShoppingBag,
  Code,
  Newspaper,
} from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

type LinkType = "article" | "youtube-video" | "github-repo" | "product";

type LinkListItemProps = {
  title: string;
  type: LinkType;
  source: string;
  timestamp: number;
  onPress?: () => void;
};

const typeLabelMap: Record<LinkType, string> = {
  article: "Article",
  "youtube-video": "Video",
  "github-repo": "Repo",
  product: "Product",
};

const getTypeIcon = (type: LinkType, color: string) => {
  switch (type) {
    case "article":
      return <Newspaper size={18} color={color} />;
    case "youtube-video":
      return <Play size={18} color={color} />;
    case "github-repo":
      return <Code size={18} color={color} />;
    case "product":
      return <ShoppingBag size={18} color={color} />;
    default:
      return <FileText size={18} color={color} />;
  }
};

export const LinkListItem = ({
  title,
  type,
  source,
  timestamp,
  onPress,
}: LinkListItemProps) => {
  const token = useColors();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-3 px-4 py-3 active:opacity-70"
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-bucket-secondary shrink-0">
        {getTypeIcon(type, token.mutedForeground || "#666")}
      </View>

      <View className="flex-1 min-w-0">
        <Text
          numberOfLines={1}
          className="text-[15px] leading-5 font-medium text-bucket-foreground"
        >
          {title}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-2 min-w-0">
          <Text className="text-[11px] font-medium text-bucket-muted-foreground uppercase tracking-wide">
            {typeLabelMap[type]}
          </Text>

          {source ? (
            <>
              <Text className="text-xs text-bucket-muted-foreground">•</Text>
              <Text
                numberOfLines={1}
                className="flex-1 text-sm text-bucket-muted-foreground"
              >
                {source}
              </Text>
            </>
          ) : null}

          <Text className="text-sm text-bucket-muted-foreground shrink-0">
            {timeAgo(timestamp)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
