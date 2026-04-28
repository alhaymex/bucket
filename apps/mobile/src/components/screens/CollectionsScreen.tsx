import { useColors } from "@/hooks/useColors";
import { api } from "@bucket/backend";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ArrowUpRight, GripVertical, Layers3, Plus } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collectionIconMap, CollectionIconName } from "../IconSelector";
import { Skeleton } from "../ui/Skeleton";
import { usePostHog } from "posthog-react-native";

// TODO: use flatlist
// Add dragging

const CollectionSkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i}>
        <View className="flex-row items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-4" />
        </View>

        {i < count - 1 && <View className="ml-16 h-px bg-bucket-border" />}
      </View>
    ))}
  </>
);

export const CollectionsScreen = () => {
  const token = useColors();
  const router = useRouter();
  const posthog = usePostHog();
  const collections = useQuery(api.collections.queries.getUserCollections);

  const systemCollections = collections?.filter((c) => c.type === "system");
  const userCollections = collections?.filter((c) => c.type === "user");

  const isLoading = collections === undefined;

  return (
    <SafeAreaView className="flex-1 bg-bucket-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-5 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-bucket-muted-foreground">
            Default Collections
          </Text>

          <View className="rounded-2xl border border-bucket-border bg-bucket-muted overflow-hidden">
            {isLoading ? (
              <CollectionSkeleton count={4} />
            ) : (
              systemCollections?.map((item, i) => {
                const Icon = item.icon
                  ? collectionIconMap[item.icon as CollectionIconName]
                  : Layers3;
                const isLast = i === systemCollections.length - 1;
                return (
                  <View key={item._id}>
                    <Pressable
                      className="flex-row items-center gap-3 px-4 py-3.5"
                      onPress={() => {
                        posthog.capture("collection_opened", {
                          collection_type: "system",
                          collection_name: item.name,
                        });
                        router.push({
                          pathname: "/[collectionId]",
                          params: { collectionId: item._id },
                        });
                      }}
                    >
                      <View className="h-9 w-9 items-center justify-center rounded-md ">
                        <Icon size={16} color={token.foreground} />
                      </View>
                      <Text className="flex-1 text-sm font-medium text-bucket-foreground">
                        {item.name}
                      </Text>
                      <ArrowUpRight size={14} color={token.mutedForeground} />
                    </Pressable>
                    {!isLast && (
                      <View className="ml-16 h-px bg-bucket-border" />
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-bucket-muted-foreground">
              Your collections
            </Text>

            <Pressable
              className="flex-row items-center gap-1.5 rounded-full bg-bucket-primary-subtle px-4 py-2 active:opacity-50"
              onPress={() => router.push("/create-collection")}
            >
              <Plus size={13} color={token.primary} />
              <Text className="text-sm font-semibold text-bucket-primary">
                New
              </Text>
            </Pressable>
          </View>

          <View className="rounded-2xl border border-bucket-border bg-bucket-muted overflow-hidden">
            {isLoading ? (
              <CollectionSkeleton count={3} />
            ) : userCollections?.length === 0 ? (
              <Text className="px-4 py-3.5 text-sm text-center text-bucket-muted-foreground">
                No collections yet
              </Text>
            ) : (
              userCollections?.map((collection, i) => {
                const Icon = collection.icon
                  ? collectionIconMap[collection.icon as CollectionIconName]
                  : Layers3;
                const isLast = i === userCollections.length - 1;
                return (
                  <View key={collection._id}>
                    <View className="flex-row items-center px-4">
                      <View className="py-3.5 pr-3">
                        <GripVertical color={token.mutedForeground} size={16} />
                      </View>

                      <Pressable
                        className="flex-1 flex-row items-center gap-3 py-3.5"
                        onPress={() => {
                          posthog.capture("collection_opened", {
                            collection_type: "user",
                            collection_name: collection.name,
                          });
                          router.push({
                            pathname: "/[collectionId]",
                            params: { collectionId: collection._id },
                          });
                        }}
                      >
                        <View className="h-9 w-9 items-center justify-center">
                          <Icon size={16} color={token.foreground} />
                        </View>

                        <Text
                          className="flex-1 text-sm font-medium text-bucket-foreground"
                          numberOfLines={1}
                        >
                          {collection.name}
                        </Text>

                        <ArrowUpRight size={14} color={token.mutedForeground} />
                      </Pressable>
                    </View>
                    {!isLast && (
                      <View className="ml-16 h-px bg-bucket-border" />
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
