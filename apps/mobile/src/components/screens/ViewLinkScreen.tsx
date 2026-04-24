import { SafeAreaView } from "react-native-safe-area-context";
import { ReaderHTML } from "../RenderHTML";
import { api, Id } from "@bucket/backend";
import { useQuery } from "convex/react";
import { Text } from "react-native";

export const ViewLinkScreen = ({ linkId }: { linkId: Id<"links"> }) => {
  const data = useQuery(api.links.queries.getUserLinkById, {
    linkId,
  });

  if (data === undefined) return <Text>Loading...</Text>;

  return (
    <SafeAreaView className="flex-1 bg-bucket-background" edges={["top"]}>
      <ReaderHTML
        canonicalUrl={data.link.canonicalUrl}
        html={data.metadata?.html}
        title={data.link.title}
      />
    </SafeAreaView>
  );
};
