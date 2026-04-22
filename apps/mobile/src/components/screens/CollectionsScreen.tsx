import { useColors } from "@/hooks/useColors";
import {
  ArrowUpRight,
  BookOpen,
  Inbox,
  Layers3,
  Lightbulb,
  Plus,
  Sparkles,
  Video,
} from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SMART_COLLECTIONS = [
  { label: "All links", value: "128", icon: Layers3 },
  { label: "Inbox", value: "24", icon: Inbox },
  { label: "Ready to sort", value: "9", icon: Sparkles },
] as const;

const COLLECTIONS = [
  {
    name: "Reading list",
    count: "42 links",
    icon: BookOpen,
    accent: true,
  },
  {
    name: "Product ideas",
    count: "18 links",
    icon: Lightbulb,
    accent: false,
  },
  {
    name: "Videos",
    count: "11 links",
    icon: Video,
    accent: false,
  },
] as const;

export const CollectionsScreen = () => {
  const token = useColors();

  return (
    <SafeAreaView className="flex-1 bg-bucket-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-5 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-bucket-foreground">
            Collections
          </Text>
          <Pressable className="flex-row items-center gap-1.5 rounded-full bg-bucket-primary-subtle px-4 py-2">
            <Plus size={13} color={token.primary} />
            <Text className="text-sm font-semibold text-bucket-primary">
              New
            </Text>
          </Pressable>
        </View>

        <View className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-bucket-muted-foreground">
            Smart views
          </Text>

          <View className="rounded-2xl border border-bucket-border bg-bucket-muted overflow-hidden">
            {SMART_COLLECTIONS.map((item, i) => {
              const Icon = item.icon;
              const isLast = i === SMART_COLLECTIONS.length - 1;
              return (
                <View key={item.label}>
                  <Pressable className="flex-row items-center gap-3 px-4 py-3.5">
                    <View className="h-9 w-9 items-center justify-center rounded-xl bg-bucket-background">
                      <Icon size={16} color={token.foreground} />
                    </View>
                    <Text className="flex-1 text-sm font-medium text-bucket-foreground">
                      {item.label}
                    </Text>
                    <Text className="text-sm font-semibold text-bucket-muted-foreground">
                      {item.value}
                    </Text>
                    <ArrowUpRight size={14} color={token.mutedForeground} />
                  </Pressable>
                  {!isLast && <View className="ml-16 h-px bg-bucket-border" />}
                </View>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-bucket-muted-foreground">
            Your collections
          </Text>

          <View className="rounded-2xl border border-bucket-border bg-bucket-muted overflow-hidden">
            {COLLECTIONS.map((collection, i) => {
              const Icon = collection.icon;
              const isLast = i === COLLECTIONS.length - 1;
              return (
                <View key={collection.name}>
                  <Pressable className="flex-row items-center gap-3 px-4 py-3.5">
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-xl ${
                        collection.accent
                          ? "bg-bucket-primary-subtle"
                          : "bg-bucket-background"
                      }`}
                    >
                      <Icon
                        size={16}
                        color={
                          collection.accent ? token.primary : token.foreground
                        }
                      />
                    </View>
                    <Text className="flex-1 text-sm font-medium text-bucket-foreground">
                      {collection.name}
                    </Text>
                    <Text className="text-sm text-bucket-muted-foreground">
                      {collection.count}
                    </Text>
                    <ArrowUpRight size={14} color={token.mutedForeground} />
                  </Pressable>
                  {!isLast && <View className="ml-16 h-px bg-bucket-border" />}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
