import { LinkListItem } from "@/components/LinkListItem";
import { useColors } from "@/hooks/useColors";
import { ArrowUpRight, Inbox, Sparkles } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONTINUE_LINKS: {
  title: string;
  type: "article" | "youtube-video" | "github-repo" | "product";
  source: string;
  timestamp: number;
}[] = [
  {
    title: "Why products need sharper onboarding loops",
    source: "Linear Blog",
    type: "article",
    timestamp: 1776889980049,
  },
  {
    title: "Reanimated 3 — gesture & layout examples",
    source: "youtube.com",
    timestamp: 1776889927213,
    type: "youtube-video",
  },
  {
    title: "software-mansion/react-native-screens",
    source: "github.com",
    type: "github-repo",
    timestamp: 1776889960621,
  },
  {
    title: "The fastest way to build a useful reading queue",
    source: "Personal blog",
    type: "article",
    timestamp: 1776889971931,
  },
  {
    title: "Notion just shipped a native mobile editor",
    source: "notion",
    timestamp: 1776889913317,
    type: "article",
  },
  {
    title: "Kindle Scribe — 2nd Gen",
    source: "amazon.com",
    timestamp: 1776889905578,
    type: "product",
  },
];

export const HomeScreen = () => {
  const token = useColors();

  return (
    <SafeAreaView className="flex-1 bg-bucket-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-5 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-2xl border border-bucket-border bg-bucket-muted overflow-hidden">
          <Pressable className="flex-row items-center gap-3 px-4 py-3.5">
            <View className="h-9 w-9 items-center justify-center">
              <Inbox size={16} color={token.foreground} />
            </View>
            <Text className="flex-1 text-sm font-medium text-bucket-foreground">
              Inbox
            </Text>
            <Text className="text-sm font-semibold text-bucket-muted-foreground">
              24
            </Text>
            <ArrowUpRight size={14} color={token.mutedForeground} />
          </Pressable>

          <View className="ml-16 h-px bg-bucket-border" />

          <Pressable className="flex-row items-center gap-3 px-4 py-3.5">
            <View className="h-9 w-9 items-center justify-center">
              <Sparkles size={16} color={token.foreground} />
            </View>
            <Text className="flex-1 text-sm font-medium text-bucket-foreground">
              Ready to sort
            </Text>
            <Text className="text-sm font-semibold text-bucket-muted-foreground">
              9
            </Text>
            <ArrowUpRight size={14} color={token.mutedForeground} />
          </Pressable>
        </View>

        <View className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-bucket-muted-foreground">
            Continue
          </Text>

          <View className="gap-2">
            {CONTINUE_LINKS.map((link, i) => (
              <LinkListItem
                key={i}
                title={link.title}
                type={link.type}
                timestamp={link.timestamp}
                source={link.source}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
