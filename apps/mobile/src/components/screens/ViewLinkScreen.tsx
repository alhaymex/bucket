import { SafeAreaView } from "react-native-safe-area-context";
import { ReaderHTML } from "../RenderHTML";

export const ViewLinkScreen = ({ linkId }: { linkId: string }) => {
  // TODO: fetch link

  return (
    <SafeAreaView>
      <ReaderHTML canonicalUrl="" />
    </SafeAreaView>
  );
};
