import { LinkListItem } from "@/components/LinkListItem";
import { useColors } from "@/hooks/useColors";
import { ArrowUpRight, Inbox, Sparkles } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONTINUE_LINKS: {
  title: string;
  source: string;
  meta: string;
  detail?: string;
}[] = [
  {
    title: "Why products need sharper onboarding loops",
    source: "Linear Blog",
    meta: "12m ago",
    detail: "8 min read",
  },
  {
    title: "Reanimated 3 — gesture & layout examples",
    source: "youtube.com",
    meta: "1h ago",
    detail: "24:13",
  },
  {
    title: "software-mansion/react-native-screens",
    source: "github.com",
    meta: "3h ago",
    detail: "12.4k ★",
  },
  {
    title: "The fastest way to build a useful reading queue",
    source: "Personal blog",
    meta: "Yesterday",
    detail: "5 min read",
  },
  {
    title: "Notion just shipped a native mobile editor",
    source: "@notionhq",
    meta: "2d ago",
  },
  {
    title: "Kindle Scribe — 2nd Gen",
    source: "amazon.com",
    meta: "2d ago",
    detail: "$339",
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
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-bucket-primary-subtle">
              <Inbox size={16} color={token.primary} />
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
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-bucket-background">
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
            {CONTINUE_LINKS.map((link) => (
              <LinkListItem
                key={`${link.title}-${link.meta}`}
                title={link.title}
                type="article"
                timestamp={123}
                detail={""}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
