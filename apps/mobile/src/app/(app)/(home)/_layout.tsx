import React from "react";
import { Stack } from "expo-router";
import {
  TAB_ROOT_STACK_SCREEN_OPTIONS,
  useTabRootScreenOptions,
} from "@/navigation/tabHeader";

export default function HomeLayout() {
  const options = useTabRootScreenOptions("Home");

  return (
    <Stack screenOptions={TAB_ROOT_STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="index" options={options} />
    </Stack>
  );
}
