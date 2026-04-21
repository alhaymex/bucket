import "@/styles/global.css";

import { ConvexProvider } from "@/providers/convex";
import { useAuth } from "@clerk/expo";
import { Stack } from "expo-router";
import { useEffect } from "react";

const Routes = () => {
  const { isSignedIn } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
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
