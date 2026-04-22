import { Stack } from "expo-router";
import React from "react";
import {
  TAB_ROOT_STACK_SCREEN_OPTIONS,
  useTabRootScreenOptions,
} from "@/navigation/tabHeader";

export default function SearchLayout() {
  const options = useTabRootScreenOptions("Search");

  return (
    <Stack screenOptions={TAB_ROOT_STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="index" options={options} />
    </Stack>
  );
}
