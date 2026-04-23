import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { AddLinkSchema, type AddLinkType } from "@/schema/LinkSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlignLeft, Clipboard, Link, X } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useEffect, useState } from "react";
import * as ExpoClipboard from "expo-clipboard";
import { isUrl } from "@/lib/url";
import { useRouter } from "expo-router";
import { CollectionSelector } from "./CollectionSelector";
import { TagInput } from "./TagInput";

export const AddLinkForm = () => {
  const token = useColors();
  const router = useRouter();

  const {
    control,
    setValue,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm<AddLinkType>({
    resolver: zodResolver(AddLinkSchema),
    defaultValues: {
      link: "",
      note: "",
      collectionId: "",
      tags: [],
    },
  });

  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await ExpoClipboard.getStringAsync();
        const trimmed = text.trim();
        setClipboardUrl(isUrl(trimmed) ? trimmed : null);
      } catch (error) {
        setClipboardUrl(null);
      }
    };

    checkClipboard();
  }, []);

  const submitForm = (form: AddLinkType) => {
    // TODO:
    console.log(form);
  };

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-bucket-muted"
        >
          <X size={16} color={token.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-bucket-foreground">
          Add link
        </Text>
        <Pressable
          disabled={!isValid || !isDirty}
          className="rounded-full bg-bucket-primary px-4 py-2 disabled:opacity-40"
          onPress={handleSubmit(submitForm)}
        >
          <Text className="text-sm font-semibold text-bucket-primary-foreground">
            Save
          </Text>
        </Pressable>
      </View>

      <View className="h-px bg-bucket-border" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <Controller
          control={control}
          name="link"
          render={({ field: { onChange, value } }) => (
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Link size={14} color={token.mutedForeground} />
                <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
                  URL
                </Text>
              </View>
              <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-bucket-border bg-bucket-muted px-4">
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="https://"
                  placeholderTextColor={token.mutedForeground}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  className="flex-1 text-base text-bucket-foreground"
                />
                {clipboardUrl && (
                  <Pressable
                    onPress={() => {
                      setValue("link", clipboardUrl, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    className="flex-row items-center gap-1.5 rounded-full bg-bucket-primary-subtle px-3 py-1.5"
                  >
                    <Clipboard size={12} color={token.primary} />
                    <Text className="text-xs font-semibold text-bucket-primary">
                      Paste
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="note"
          render={({ field: { value, onChange } }) => (
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <AlignLeft size={14} color={token.mutedForeground} />
                <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
                  Note
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
          name="collectionId"
          render={({ field: { value } }) => (
            <CollectionSelector
              onSelect={(id) => {
                setValue("collectionId", id, {
                  shouldDirty: value.length > 0,
                  shouldTouch: value.length > 0,
                  shouldValidate: true,
                });
              }}
              selected={value}
            />
          )}
        />

        <Controller
          control={control}
          name="tags"
          render={({ field: { value, onChange } }) => (
            <TagInput value={value} onChange={onChange} />
          )}
        />
      </ScrollView>
    </View>
  );
};
