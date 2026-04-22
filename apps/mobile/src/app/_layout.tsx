import "@/styles/global.css";

import { ConvexProvider } from "@/providers/ConvexProvider";
import { useAuth } from "@clerk/expo";
import { Stack } from "expo-router";

const Routes = () => {
  const { isSignedIn } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(app)" />
        <Stack.Screen
          name="add"
          options={{ presentation: "modal", headerShown: true, title: "Add" }}
        />
        <Stack.Screen
          name="profile"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Profile",
          }}
        />
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
