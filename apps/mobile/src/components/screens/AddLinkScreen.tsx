import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import {
  X,
  Link,
  Tag,
  AlignLeft,
  Folder,
  Clipboard,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ExpoClipboard from "expo-clipboard";

const COLLECTIONS = ["Reading List", "Design", "Dev", "Inspiration", "Work"];

export const AddLinkScreen = () => {
  const token = useColors();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null,
  );
  const [clipboardHasUrl, setClipboardHasUrl] = useState(false);

  const noteRef = useRef<TextInput>(null);
  const tagRef = useRef<TextInput>(null);

  const isValid = url.trim().length > 0;

  const isUrl = (text: string) => /^https?:\/\/.+/.test(text.trim());

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await ExpoClipboard.getStringAsync();
        setClipboardHasUrl(isUrl(text));
      } catch {
        setClipboardHasUrl(false);
      }
    };
    checkClipboard();
  }, []);

  const handlePaste = async () => {
    try {
      const text = await ExpoClipboard.getStringAsync();
      if (isUrl(text)) {
        setUrl(text.trim());
        setClipboardHasUrl(false);
      }
    } catch {}
  };

  const handleAddTag = () => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTag("");
  };

  const handleRemoveTag = (t: string) => {
    setTags((prev) => prev.filter((item) => item !== t));
  };

  return (
    <SafeAreaView className="flex-1 bg-bucket-background" edges={["bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">
            {/* Header */}
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
                disabled={!isValid}
                className={`rounded-full bg-bucket-primary px-4 py-2 ${!isValid ? "opacity-40" : ""}`}
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
              {/* URL */}
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Link size={14} color={token.mutedForeground} />
                  <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
                    URL
                  </Text>
                </View>
                <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-bucket-border bg-bucket-muted px-4">
                  <TextInput
                    value={url}
                    onChangeText={(v) => {
                      setUrl(v);
                      setClipboardHasUrl(false);
                    }}
                    placeholder="https://"
                    placeholderTextColor={token.mutedForeground}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => noteRef.current?.focus()}
                    className="flex-1 text-base text-bucket-foreground"
                  />
                  {clipboardHasUrl && !url && (
                    <Pressable
                      onPress={handlePaste}
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

              {/* Note */}
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <AlignLeft size={14} color={token.mutedForeground} />
                  <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
                    Note
                  </Text>
                </View>
                <TextInput
                  ref={noteRef}
                  value={note}
                  onChangeText={setNote}
                  placeholder="What's this about?"
                  placeholderTextColor={token.mutedForeground}
                  multiline
                  returnKeyType="next"
                  onSubmitEditing={() => tagRef.current?.focus()}
                  className="min-h-[80px] rounded-2xl border border-bucket-border bg-bucket-muted px-4 py-4 text-base leading-6 text-bucket-foreground"
                />
              </View>

              {/* Collection */}
              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <Folder size={14} color={token.mutedForeground} />
                  <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
                    Collection
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2"
                  keyboardShouldPersistTaps="handled"
                >
                  {COLLECTIONS.map((col) => {
                    const active = selectedCollection === col;
                    return (
                      <Pressable
                        key={col}
                        onPress={() =>
                          setSelectedCollection(active ? null : col)
                        }
                        className={`rounded-full border px-4 py-2 ${
                          active
                            ? "border-bucket-primary bg-bucket-primary-subtle"
                            : "border-bucket-border bg-bucket-muted"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            active
                              ? "text-bucket-primary"
                              : "text-bucket-foreground"
                          }`}
                        >
                          {col}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Tags */}
              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <Tag size={14} color={token.mutedForeground} />
                  <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
                    Tags
                  </Text>
                </View>

                <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-bucket-border bg-bucket-muted px-4">
                  <TextInput
                    ref={tagRef}
                    value={tag}
                    onChangeText={setTag}
                    placeholder="Add a tag"
                    placeholderTextColor={token.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleAddTag}
                    blurOnSubmit={false}
                    className="flex-1 text-base text-bucket-foreground"
                  />
                  {tag.trim().length > 0 && (
                    <Pressable
                      onPress={handleAddTag}
                      className="rounded-full bg-bucket-primary-subtle px-3 py-1"
                    >
                      <Text className="text-xs font-semibold text-bucket-primary">
                        Add
                      </Text>
                    </Pressable>
                  )}
                </View>

                {tags.length > 0 && (
                  <View className="flex-row flex-wrap gap-2">
                    {tags.map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => handleRemoveTag(t)}
                        className="flex-row items-center gap-1 rounded-full border border-bucket-border bg-bucket-muted px-3 py-1.5"
                      >
                        <Text className="text-sm text-bucket-foreground">
                          {t}
                        </Text>
                        <X size={12} color={token.mutedForeground} />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
