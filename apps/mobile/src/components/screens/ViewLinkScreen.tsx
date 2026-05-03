import { SafeAreaView } from "react-native-safe-area-context";
import { ReaderHTML } from "../RenderHTML";
import { api, Id } from "@bucket/backend";
import { useQuery } from "convex/react";
import { View } from "react-native";
import { Skeleton } from "../ui/Skeleton";
import { LinkScreenHeader } from "../LinkScreenHeader";
import { EmbedView } from "../RenderEmbed";
import { PDFView } from "../RenderPDF";
import { usePostHog } from "posthog-react-native";
import { useEffect } from "react";

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
  const posthog = usePostHog();

  useEffect(() => {
    if (data?.link) {
      posthog.capture("link_viewed", {
        render_type: data.link.renderType,
        platform: data.link.platform ?? null,
      });
    }
    // posthog is a stable singleton — excluded from deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.link]);

  if (data === undefined) return <ArticleSkeleton />;

  return (
    <SafeAreaView className="flex-1 bg-bucket-background" edges={["top"]}>
      <LinkScreenHeader
        url={data.link.canonicalUrl}
        title={data.link.title ?? "View"}
        readingTime={data.metadata?.readingTime}
      />
      {data.link.renderType === "pdf" ? (
        <PDFView url={data.link.canonicalUrl} />
      ) : data.link.renderType === "embed" ? (
        <EmbedView
          canonicalUrl={data.link.canonicalUrl}
          embedUrl={data.link.embedUrl}
          externalId={data.link.externalId}
          platform={data.link.platform}
          title={data.link.title}
        />
      ) : (
        <ReaderHTML
          canonicalUrl={data.link.canonicalUrl}
          html={data.metadata?.html}
          title={data.link.title}
        />
      )}
    </SafeAreaView>
  );
};
