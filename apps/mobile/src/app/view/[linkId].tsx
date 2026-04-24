import { ViewLinkScreen } from "@/components/screens/ViewLinkScreen";
import { useLocalSearchParams } from "expo-router";

export default function View() {
  const { linkId } = useLocalSearchParams<{ linkId: string }>();

  return <ViewLinkScreen linkId={linkId} />;
}
