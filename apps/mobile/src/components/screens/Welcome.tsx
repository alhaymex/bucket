import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { useRouter } from "expo-router";

const Welcome = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-stone-950">
      <View className="flex-1 px-6 py-12">
        <View className="flex-1 items-center justify-center">
          <Text className="px-8 text-center text-3xl font-bold leading-7 text-stone-300">
            Welcome to Bucket!
          </Text>
          <Text className="px-8 text-center text-base leading-7 text-stone-300">
            Save and organize your links
          </Text>
        </View>

        <View className="gap-3 pb-2">
          <Pressable
            onPress={() => router.push("/(auth)/sign-in")}
            className="h-14 items-center justify-center rounded-2xl bg-white"
          >
            <Text className="text-base font-semibold text-stone-950">
              Sign in
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/sign-up")}
            className="h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5"
          >
            <Text className="text-base font-semibold text-white">Sign up</Text>
          </Pressable>
        </View>
        <View className="flex-row justify-between px-3 mt-6">
          <Pressable onPress={() => router.push("/(app)")}>
            <Text className="text-base font-semibold text-white">Language</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(app)")}>
            <Text className="text-base font-semibold text-white">Theme</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;
