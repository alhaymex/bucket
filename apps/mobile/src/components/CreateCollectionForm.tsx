import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import { ScrollView, Text, TextInput, View } from "react-native";
import { FormHeader } from "./FormHeader";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateCollectionSchema, CreateCollectionType } from "@bucket/common";
import { AlignLeft, Pencil } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@bucket/backend";
import { CollectionIconName, IconSelector } from "./IconSelector";

export const CreateCollectionForm = () => {
  const token = useColors();
  const router = useRouter();
  const createCollectionMutation = useMutation(
    api.collections.mutations.createCollection,
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = useForm<CreateCollectionType>({
    resolver: zodResolver(CreateCollectionSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: undefined,
    },
  });

  const submitForm = (form: CreateCollectionType) => {
    createCollectionMutation({
      name: form.name,
      description: form.description,
      icon: form.icon,
    });

    reset();

    router.back();
  };

  return (
    <View className="flex-1">
      <FormHeader
        title="Create collection"
        actionTitle="Save"
        onClose={() => router.back()}
        onSave={handleSubmit(submitForm)}
        canSave={isValid && isDirty}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Pencil size={14} color={token.mutedForeground} />
                <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
                  Name
                </Text>
              </View>
              <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-bucket-border bg-bucket-muted px-4">
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="collection name"
                  placeholderTextColor={token.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  className="flex-1 text-base text-bucket-foreground"
                />
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <AlignLeft size={14} color={token.mutedForeground} />
                <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
                  Description
                </Text>
              </View>
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="What's this about?"
                placeholderTextColor={token.mutedForeground}
                multiline
                returnKeyType="next"
                className="min-h-[80px] rounded-2xl border border-bucket-border bg-bucket-muted px-4 py-4 text-base leading-6 text-bucket-foreground"
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="icon"
          render={({ field: { value, onChange } }) => (
            <IconSelector
              selected={value as CollectionIconName | undefined}
              onSelect={onChange}
            />
          )}
        />
      </ScrollView>
    </View>
  );
};
