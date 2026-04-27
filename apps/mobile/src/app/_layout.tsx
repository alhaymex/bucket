import "@/styles/global.css";

import { ConvexProvider } from "@/providers/ConvexProvider";
import { useAuth } from "@clerk/expo";
import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

const Routes = () => {
  const token = useColors();
  const { isSignedIn, isLoaded } = useAuth();

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

export default function RootLayout() {
  return (
    <ConvexProvider>
      <Routes />
    </ConvexProvider>
  );
}
