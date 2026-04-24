import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export const LinkScreenHeader = () => {
  const token = useColors();
  const router = useRouter();

  return (
    <View>
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-bucket-muted"
        >
          <X size={16} color={token.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-bucket-foreground">
          Article
        </Text>
        <Pressable className="rounded-full bg-bucket-primary px-4 py-2 disabled:opacity-40">
          <Text className="text-sm font-semibold text-bucket-primary-foreground">
            Save
          </Text>
        </Pressable>
      </View>
      <View className="h-px bg-bucket-border" />
    </View>
  );
};
