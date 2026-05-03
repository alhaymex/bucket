import "@/styles/global.css";

import { Sentry } from "@/lib/sentry";
import { posthog } from "@/lib/posthog";
import { ConvexProvider } from "@/providers/ConvexProvider";
import { useAuth } from "@clerk/expo";
import { Stack, usePathname, useGlobalSearchParams, router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { PostHogProvider } from "posthog-react-native";
import { useEffect, useRef } from "react";
import { useShareIntent } from "expo-share-intent";

const Routes = () => {
  const token = useColors();
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    if (!hasShareIntent) return;

    const url =
      shareIntent?.webUrl || shareIntent?.text || shareIntent?.files?.[0]?.path;

    if (!url) return;

    router.replace({
      pathname: "/share",
      params: { url },
    });

    resetShareIntent();
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  if (!isLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackButtonDisplayMode: "minimal",
        headerTintColor: token.foreground,
      }}
    >
      <Stack.Protected guard={isSignedIn === true}>
        <Stack.Screen name="(app)" />
        <Stack.Screen
          name="add"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="create-collection"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="view/[linkId]"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="[collectionId]"
          options={{ headerShown: true, headerTransparent: true }}
        />
        <Stack.Screen
          name="profile"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={isSignedIn === false}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
};

function RootLayout() {
  return (
    <ConvexProvider>
      <PostHogProvider
        client={posthog}
        autocapture={{
          captureScreens: true,
          captureTouches: true,
          propsToCapture: ["testID"],
        }}
      >
        <Routes />
      </PostHogProvider>
    </ConvexProvider>
  );
}

export default Sentry.wrap(RootLayout);
