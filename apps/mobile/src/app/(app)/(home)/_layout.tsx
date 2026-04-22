import { View, Text, Alert } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const HomeLayout = () => {
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
          title: "Home",
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
            },
            {
              type: "button",
              label: "Profile",
              icon: {
                type: "sfSymbol",
                name: "person.fill",
              },
              onPress() {
                Alert.alert("Profile button pressed");
              },
              variant: "plain",
              sharesBackground: false,
            },
          ],
        }}
      />
    </Stack>
  );
};

export default HomeLayout;
