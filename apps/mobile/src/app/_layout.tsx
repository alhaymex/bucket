import { ConvexProvider } from "@/providers/convex";
import { Stack } from "expo-router";

const Routes = () => {
  const isLoggedIn = false;

  return (
    <Stack>
      <Stack.Protected guard={isLoggedIn}></Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}></Stack.Protected>
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
