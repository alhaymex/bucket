import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import { ArrowUpRight, Pause, Play, Share, X } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Linking, Pressable, Text, View } from "react-native";

interface LinkScreenHeaderProps {
  url: string;
}

export const LinkScreenHeader = ({ url }: LinkScreenHeaderProps) => {
  const token = useColors();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const totalSeconds = 240;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View>
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full bg-bucket-muted flex-shrink-0"
          >
            <X size={15} color={token.foreground} />
          </Pressable>

          <View className="flex-1 min-w-0">
            <Text
              className="text-sm font-semibold text-bucket-foreground"
              numberOfLines={1}
            >
              Article
            </Text>
            <Text
              className="text-xs text-bucket-muted-foreground"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {url.replace(/^https?:\/\//, "").split("/")[0]}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 flex-shrink-0 ml-3">
          <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-bucket-muted opacity-50">
            <Share size={14} color={token.foreground} fill={token.foreground} />
          </Pressable>
          <Pressable
            // onPress={togglePlay}
            className="h-9 w-9 items-center justify-center rounded-full bg-bucket-muted opacity-50"
          >
            {isPlaying ? (
              <Pause
                size={14}
                color={token.foreground}
                fill={token.foreground}
              />
            ) : (
              <Play
                size={14}
                color={token.foreground}
                fill={token.foreground}
              />
            )}
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(url)}
            className="flex-row items-center gap-1 rounded-full bg-bucket-primary px-4 py-2"
          >
            <Text className="text-sm font-semibold text-bucket-primary-foreground">
              Open
            </Text>
            <ArrowUpRight size={13} color={token.primaryForeground} />
          </Pressable>
        </View>
      </View>

      {(isPlaying || elapsed > 0) && (
        <View className="flex-row items-center gap-3 bg-bucket-muted px-4 py-2">
          <Pressable
            onPress={togglePlay}
            className="h-7 w-7 items-center justify-center rounded-full bg-bucket-foreground"
          >
            {isPlaying ? (
              <Pause
                size={10}
                color={token.background}
                fill={token.background}
              />
            ) : (
              <Play
                size={10}
                color={token.background}
                fill={token.background}
              />
            )}
          </Pressable>

          <View className="h-[3px] flex-1 overflow-hidden rounded-full bg-bucket-border">
            <Animated.View
              style={{ width: progressWidth }}
              className="h-full rounded-full bg-bucket-foreground"
            />
          </View>

          <Text className="w-8 text-right text-[11px] text-bucket-muted-foreground">
            {formatTime(elapsed)}
          </Text>
        </View>
      )}

      <View className="h-px bg-bucket-border" />
    </View>
  );
};
