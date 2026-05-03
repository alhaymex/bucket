import { LinkListItem } from "@/components/LinkListItem";
import { api, Id } from "@bucket/backend";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { FlatList, Text, View } from "react-native";
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

export const CollectionScreen = ({
  collectionId,
}: {
  collectionId: Id<"collections">;
}) => {
  const router = useRouter();
  const data = useQuery(api.collections.queries.getCollectionById, {
    collectionId,
  });

  const isLoading = data === undefined;
  const links = data?.links ?? [];

  return (
    <>
      <Stack.Screen options={{ title: data?.name ?? "Collection" }} />

      <SafeAreaView className="flex-1 bg-bucket-background" edges={["bottom"]}>
        <FlatList
          className="flex-1"
          data={links}
          keyExtractor={(item) => item._id}
          contentContainerClassName="px-5 pb-6 pt-28"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="flex-row items-center mb-8 gap-3">
              <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-bucket-muted-foreground">
                Links
              </Text>
              <Text className="text-xs text-bucket-muted-foreground">•</Text>
              <Text className="text-xs leading-6 text-bucket-muted-foreground">
                {isLoading
                  ? "Fetching links in this collection."
                  : `${links.length} saved ${links.length === 1 ? "link" : "links"}`}
              </Text>
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <LinkListSkeleton />
            ) : (
              <View className="rounded-2xl border border-bucket-border bg-bucket-muted px-4 py-5">
                <Text className="text-sm text-bucket-muted-foreground">
                  No links in this collection yet.
                </Text>
              </View>
            )
          }
          renderItem={({ item: link }) => (
            <LinkListItem
              title={link.title}
              url={link.url}
              faviconUrl={link.faviconUrl}
              contentType={link.contentType}
              readingTime={link.readingTime}
              lastViewedAt={link.lastViewedAt ?? link._creationTime}
              onPress={() => {
                router.push({
                  pathname: "/view/[linkId]",
                  params: { linkId: link._id },
                });
              }}
            />
          )}
        />
      </SafeAreaView>
    </>
  );
};
