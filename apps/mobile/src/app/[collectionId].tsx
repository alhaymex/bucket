import { CollectionScreen } from "@/components/screens/CollectionScreen";
import { Id } from "@bucket/backend";
import { useLocalSearchParams } from "expo-router";

export default function Collection() {
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();

  return <CollectionScreen collectionId={collectionId as Id<"collections">} />;
}
