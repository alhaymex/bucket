import { Stack } from "expo-router";

export default function RootLayout() {
  const isLoggedIn = false;

  return (
    <Stack>
      <Stack.Protected guard={isLoggedIn}></Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}></Stack.Protected>
    </Stack>
  );
}
