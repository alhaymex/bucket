import { Stack } from "expo-router";
import React from "react";
import { Alert } from "react-native";

export default function CollectionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerTitleStyle: { color: "white" },
        headerLargeTitleStyle: { fontSize: 35 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Add",
              icon: {
                type: "sfSymbol",
                name: "plus",
              },
              onPress() {
                Alert.alert("Add button pressed");
              },
              variant: "plain",
              sharesBackground: false,
            },
            {
              type: "button",
              label: "Profile",
              icon: {
                type: "sfSymbol",
                name: "person.fill",
              },
              onPress() {
                Alert.alert("Add button pressed");
              },
              variant: "plain",
            },
          ],
        }}
      />
    </Stack>
  );
}
