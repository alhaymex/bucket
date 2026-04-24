import { SafeAreaView } from "react-native-safe-area-context";
import { ReaderHTML } from "../RenderHTML";
import { api, Id } from "@bucket/backend";
import { useQuery } from "convex/react";
import { Text, View } from "react-native";
import { Skeleton } from "../ui/Skeleton";
import { LinkScreenHeader } from "../LinkScreenHeader";

export const ArticleSkeleton = () => {
  return (
    <View className="flex-1 px-4 py-6 gap-6 bg-bucket-background">
      <View className="gap-2">
        <Skeleton className="h-6 w-[90%]" />
        <Skeleton className="h-6 w-[70%]" />
      </View>

      <View className="flex-row items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </View>

      <Skeleton className="h-52 w-full rounded-xl" />

      <View className="gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{
              width: `${80 + Math.random() * 20}%`,
            }}
          />
        ))}
      </View>

      <View className="gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{
              width: `${70 + Math.random() * 25}%`,
            }}
          />
        ))}
      </View>
    </View>
  );
};

export const ViewLinkScreen = ({ linkId }: { linkId: Id<"links"> }) => {
  const data = useQuery(api.links.queries.getUserLinkById, {
    linkId,
  });

  if (data === undefined) return <ArticleSkeleton />;

  return (
    <SafeAreaView className="flex-1 bg-bucket-background" edges={["top"]}>
      <LinkScreenHeader />
      <ReaderHTML
        canonicalUrl={data.link.canonicalUrl}
        html={data.metadata?.html}
        title={data.link.title}
      />
    </SafeAreaView>
  );
};
