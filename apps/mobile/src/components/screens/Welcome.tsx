import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { useRouter } from "expo-router";

const Welcome = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bucket-background">
      <View className="flex-1 px-6 py-12">
        <View className="flex-1 items-center justify-center">
          <Text className="px-8 text-center text-3xl font-bold leading-7 text-bucket-foreground">
            Welcome to Bucket!
          </Text>
          <Text className="px-8 text-center text-base leading-7 text-bucket-muted-foreground">
            Save and organize your links
          </Text>
        </View>

        <View className="gap-3 pb-2">
          <Pressable
            onPress={() => router.push("/(auth)/sign-in")}
            className="h-14 items-center justify-center rounded-2xl bg-bucket-primary"
          >
            <Text className="text-base font-semibold text-bucket-primary-foreground">
              Sign in
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/sign-up")}
            className="h-14 items-center justify-center rounded-2xl border border-bucket-border bg-bucket-card"
          >
            <Text className="text-base font-semibold text-bucket-card-foreground">
              Sign up
            </Text>
          </Pressable>
        </View>
        <View className="mt-6 flex-row justify-between px-3">
          <Pressable onPress={() => router.push("/(app)")}>
            <Text className="text-base font-semibold text-bucket-muted-foreground">
              Language
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(app)")}>
            <Text className="text-base font-semibold text-bucket-muted-foreground">
              Theme
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;
