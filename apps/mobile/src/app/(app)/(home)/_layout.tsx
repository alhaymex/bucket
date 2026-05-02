import React from "react";
import { Stack } from "expo-router";
import {
  TAB_ROOT_STACK_SCREEN_OPTIONS,
  useTabRootScreenOptions,
} from "@/navigation/tabHeader";
import { useColors } from "@/hooks/useColors";

export default function HomeLayout() {
  const token = useColors();
  const options = useTabRootScreenOptions("Home");

  return (
    <Stack
      screenOptions={{
        ...TAB_ROOT_STACK_SCREEN_OPTIONS,
        headerTitleStyle: { color: token.foreground },
      }}
    >
      :
      <Stack.Screen name="index" options={options} />
    </Stack>
  );
}
