import { useColors } from "@/hooks/useColors";
import { Ellipsis, File } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

type LinkType = "article" | "youtube-video" | "github-repo" | "product";

type LinkListItemProps = {
  title: string;
  type: LinkType;
  timestamp: number;
  detail: string;
};

export const LinkListItem = ({
  title,
  type,
  timestamp,
  detail,
}: LinkListItemProps) => {
  const token = useColors();

  return (
    <Pressable className="flex-row items-center gap-4 py-4 active:opacity-70">
      <View className="w-10 h-10 shrink-0 items-center justify-center">
        <File size={22} color={token.mutedForeground || "#666"} />
      </View>

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className="text-base font-medium text-bucket-foreground flex-1"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-0.5">
          <View className="flex-row items-center gap-1.5 flex-1 pr-2 min-w-0">
            <Text className="text-xs text-green-500 font-bold rounded-md p-0.5 px-2">
              {Math.floor(Math.random() * 100)}%
            </Text>
            <Text className="text-xs text-bucket-foreground bg-bucket-border rounded-md p-0.5 px-2">{type}</Text>

            {detail && (
              <>
                <Text className="text-xs text-bucket-muted-foreground">•</Text>
                <Text
                  className="text-xs text-bucket-muted-foreground flex-1"
                  numberOfLines={1}
                >
                  {detail}
                </Text>
              </>
            )}
          </View>
          <Text className="text-xs text-bucket-muted-foreground shrink-0">
            2 mins ago
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
