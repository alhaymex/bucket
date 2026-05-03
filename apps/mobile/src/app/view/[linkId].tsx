import { ViewLinkScreen } from "@/components/screens/ViewLinkScreen";
import { Id } from "@bucket/backend";
import { router, useLocalSearchParams } from "expo-router";

export default function ViewLink() {
  const { linkId } = useLocalSearchParams<{ linkId: string }>();

  if (!linkId) return void router.replace("/") as never;

  return <ViewLinkScreen linkId={linkId as Id<"links">} />;
}
