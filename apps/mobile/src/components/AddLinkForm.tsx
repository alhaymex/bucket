import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { type AddLinkType, isUrl } from "@bucket/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlignLeft, Clipboard, Link } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useEffect, useState } from "react";
import * as ExpoClipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { CollectionSelector } from "./CollectionSelector";
import { TagInput } from "./TagInput";
import { useMutation } from "convex/react";
import { api, Id } from "@bucket/backend";
import { ConvexAddLinkSchema } from "@/schema/linkSchema";
import { FormHeader } from "./FormHeader";
import { usePostHog } from "posthog-react-native";

export const AddLinkForm = () => {
  const token = useColors();
  const router = useRouter();
  const addLinkMutation = useMutation(api.links.mutations.saveLink);
  const posthog = usePostHog();

  const {
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = useForm<AddLinkType>({
    resolver: zodResolver(ConvexAddLinkSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      url: "",
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
      } catch {
        setClipboardUrl(null);
      }
    };

    checkClipboard();
  }, []);

  const submitForm = async (form: AddLinkType) => {
    const parsed = ConvexAddLinkSchema.safeParse(form);

    if (!parsed.success) {
      Alert.alert(
        "Could not save link",
        "Please enter a valid URL and choose a collection.",
      );
      return;
    }

    try {
      await addLinkMutation({
        collectionId: parsed.data.collectionId as Id<"collections">,
        url: parsed.data.url,
        tags: parsed.data.tags,
        note: parsed.data.note,
      });

      posthog.capture("link_saved", {
        has_collection: Boolean(parsed.data.collectionId),
        tag_count: parsed.data.tags?.length ?? 0,
        has_note: Boolean(parsed.data.note),
      });

      reset();
      router.back();
    } catch {
      Alert.alert("Could not save link", "Please check the URL and try again.");
    }
  };

  return (
    <View className="flex-1">
      <FormHeader
        title="Add Link"
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
          name="url"
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
                  placeholder="example.com or https://example.com"
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
                      posthog.capture("link_pasted_from_clipboard");
                      setValue("url", clipboardUrl, {
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
                  shouldDirty: true,
                  shouldTouch: true,
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
