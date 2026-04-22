import { Stack } from "expo-router";
import React from "react";
import {
  TAB_ROOT_STACK_SCREEN_OPTIONS,
  useTabRootScreenOptions,
} from "@/navigation/tabHeader";

export default function CollectionsLayout() {
  const options = useTabRootScreenOptions("Collections");

  return (
    <Stack screenOptions={TAB_ROOT_STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="index" options={options} />
    </Stack>
  );
}
