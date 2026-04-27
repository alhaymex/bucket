import { ViewLinkScreen } from "@/components/screens/ViewLinkScreen";
import { Id } from "@bucket/backend";
import { useLocalSearchParams } from "expo-router";

export default function ViewLink() {
  const { linkId } = useLocalSearchParams<{ linkId: string }>();

  return <ViewLinkScreen linkId={linkId as Id<"links">} />;
}
