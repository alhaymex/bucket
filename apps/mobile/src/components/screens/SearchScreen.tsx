import { LinkListItem } from "@/components/LinkListItem";
import { api } from "@bucket/backend";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import type {
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from "react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SearchBarCommands } from "react-native-screens";
import { Skeleton } from "../ui/Skeleton";

const SUGGESTED_SEARCHES = ["Reading list", "Expo", "Design", "React Native"];

type LinkListContentType = React.ComponentProps<
  typeof LinkListItem
>["contentType"];

const LinkListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <View className="gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="flex-row items-center gap-4 px-2 py-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-3 w-[50%]" />
          </View>
        </View>
      ))}
    </View>
  );
};

const getLinkListContentType = (
  contentType:
    | "video"
    | "social"
    | "article"
    | "product"
    | "document"
    | "generic",
): LinkListContentType => {
  switch (contentType) {
    case "video":
      return "youtube";
    case "social":
      return "tweet";
    case "product":
      return "product";
    case "article":
    case "document":
      return "article";
    default:
      return "generic";
  }
};

export const SearchScreen = () => {
  const router = useRouter();
  const searchBarRef = React.useRef<SearchBarCommands | null>(null);
  const [query, setQuery] = React.useState("");

  const trimmedQuery = query.trim();
  const results = useQuery(
    api.links.queries.searchUserLinks,
    trimmedQuery ? { query: trimmedQuery, limit: 20 } : "skip",
  );
  const isSearching = trimmedQuery.length > 0;
  const isLoading = isSearching && results === undefined;
  const links = results ?? [];

  const handleSearchChange = React.useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setQuery(event.nativeEvent.text);
    },
    [],
  );

  const applySuggestedSearch = React.useCallback((term: string) => {
    setQuery(term);
    searchBarRef.current?.setText(term);
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: "Search" }} />
      <Stack.SearchBar
        ref={searchBarRef}
        placement="automatic"
        placeholder="Search links"
        onChangeText={handleSearchChange}
        onCancelButtonPress={() => setQuery("")}
        onClose={() => setQuery("")}
      />

      <SafeAreaView className="flex-1 bg-bucket-background" edges={["bottom"]}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-8 px-5 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3">
            <View className="flex-row flex-wrap gap-2">
              {SUGGESTED_SEARCHES.map((term) => (
                <Pressable
                  key={term}
                  onPress={() => applySuggestedSearch(term)}
                  className="rounded-full bg-bucket-primary-subtle px-3 py-2 active:opacity-70"
                >
                  <Text className="text-xs font-semibold text-bucket-primary">
                    {term}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-bucket-muted-foreground">
                {isSearching ? "Results" : "Search"}
              </Text>
              {isSearching && (
                <>
                  <Text className="text-xs text-bucket-muted-foreground">
                    •
                  </Text>
                  <Text className="text-xs leading-6 text-bucket-muted-foreground">
                    {isLoading
                      ? "Searching saved links."
                      : `${links.length} ${links.length === 1 ? "match" : "matches"}`}
                  </Text>
                </>
              )}
            </View>

            {!isSearching ? (
              <View className="rounded-2xl border border-bucket-border bg-bucket-muted px-4 py-5">
                <Text className="text-sm text-bucket-muted-foreground">
                  Search by link title.
                </Text>
              </View>
            ) : isLoading ? (
              <LinkListSkeleton />
            ) : links.length > 0 ? (
              <View className="gap-2">
                {links.map((link) => (
                  <LinkListItem
                    key={link._id}
                    title={link.title}
                    url={link.url}
                    contentType={getLinkListContentType(link.contentType)}
                    lastViewedAt={link.lastViewedAt ?? link._creationTime}
                    onPress={() => {
                      router.push({
                        pathname: "/view/[linkId]",
                        params: { linkId: link._id },
                      });
                    }}
                  />
                ))}
              </View>
            ) : (
              <View className="rounded-2xl border border-bucket-border bg-bucket-muted px-4 py-5">
                <Text className="text-sm text-bucket-muted-foreground">
                  No links match {trimmedQuery}.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};
