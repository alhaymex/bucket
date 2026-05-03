import { api } from "@bucket/backend";
import { urlSchema } from "@bucket/common";
import { useMutation } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Share() {
  const { url } = useLocalSearchParams<{ url?: string }>();
  const saveLink = useMutation(api.links.mutations.saveLink);
  const parsed = urlSchema.safeParse(url);

  useEffect(() => {
    if (!parsed.success) return void router.replace("/add");

    saveLink({ url: parsed.data, note: "", tags: [] })
      .then(() => router.replace("/"))
      .catch(() =>
        router.replace({ pathname: "/add", params: { url: parsed.data } }),
      );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView
      className="flex-1 items-center justify-center bg-bucket-background"
      edges={["bottom"]}
    >
      <ActivityIndicator size={"large"} />
    </SafeAreaView>
  );
}
