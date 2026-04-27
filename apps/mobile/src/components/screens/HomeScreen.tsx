import { LinkListItem } from "@/components/LinkListItem";
import { useColors } from "@/hooks/useColors";
import { api } from "@bucket/backend";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ArrowUpRight, Inbox, Sparkles } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../ui/Skeleton";

const LinkListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <View className="gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="flex-row items-center gap-4 py-4 px-2">
          <Skeleton className="h-10 w-10 rounded-md shrink-0" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-3 w-[50%]" />
          </View>
        </View>
      ))}
    </View>
  );
};

export const HomeScreen = () => {
  const token = useColors();
  const data = useQuery(api.links.queries.getUserRecentLinks);
  const router = useRouter();

  const isLoading = data === undefined;

  return (
    <SafeAreaView className="flex-1 bg-bucket-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-5 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-bucket-muted-foreground">
            Recent
          </Text>

          <View className="gap-2">
            {isLoading ? (
              <LinkListSkeleton />
            ) : (
              data.map((link) => (
                <LinkListItem
                  key={link._id}
                  title={link.title}
                  url={link.url}
                  contentType="generic"
                  lastViewedAt={link.lastViewedAt!}
                  onPress={() => {
                    router.push({
                      pathname: "/view/[linkId]",
                      params: { linkId: link._id },
                    });
                  }}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
