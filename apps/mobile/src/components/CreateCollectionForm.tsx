import { View, Text } from "react-native";
import React from "react";
import { FormHeader } from "./FormHeader";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";

export const CreateCollectionForm = () => {
  const token = useColors();
  const router = useRouter();

  return (
    <View className="flex-1">
      <FormHeader
        title="Create collection"
        actionTitle="Save"
        onClose={() => router.back()}
        onSave={() => {}}
        canSave={false}
      />
    </View>
  );
};
