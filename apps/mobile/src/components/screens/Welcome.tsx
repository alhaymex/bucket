import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { useRouter } from "expo-router";
import { Globe, Sun } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";

const Welcome = () => {
  const router = useRouter();
  const token = useColors();

  return (
    <SafeAreaView className="flex-1 bg-bucket-background">
      <View className="flex-1 px-6 py-12">
        <View className="flex-1 items-center justify-center gap-6">
          <View className="items-center gap-3">
            <View className="rounded-full bg-bucket-primary-subtle px-4 py-2">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-bucket-primary">
                Bucket
              </Text>
            </View>
            <Text className="text-center text-3xl font-bold text-bucket-foreground">
              Save what matters
            </Text>
            <Text className="text-center text-base leading-7 text-bucket-muted-foreground">
              Organize your links before they get lost.
            </Text>
          </View>
        </View>

        <View className="gap-3 pb-2">
          <Pressable
            onPress={() => router.push("/(auth)/sign-up")}
            className="h-14 items-center justify-center rounded-2xl bg-bucket-primary"
          >
            <Text className="text-base font-semibold text-bucket-primary-foreground">
              Get started
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/sign-in")}
            className="h-14 items-center justify-center rounded-2xl border border-bucket-border"
          >
            <Text className="text-base font-semibold text-bucket-foreground">
              Sign in
            </Text>
          </Pressable>
        </View>

        <View className="mt-6 flex-row justify-between px-3">
          <Pressable
            onPress={() => router.push("/(app)")}
            className="flex-row items-center gap-2"
          >
            <Globe size={16} color={token.mutedForeground} />
            <Text className="text-sm text-bucket-muted-foreground">
              Language
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(app)")}
            className="flex-row items-center gap-2"
          >
            <Sun size={16} color={token.mutedForeground} />
            <Text className="text-sm text-bucket-muted-foreground">Theme</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;
