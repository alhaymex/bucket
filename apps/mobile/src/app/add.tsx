import { Stack } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Add" }} />
      <SafeAreaView className="flex-1 items-center justify-center bg-bucket-background px-6">
        <Text className="text-bucket-foreground">Add modal</Text>
      </SafeAreaView>
    </>
  );
}
