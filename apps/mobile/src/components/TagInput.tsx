import { useColors } from "@/hooks/useColors";
import { Tag, X } from "lucide-react-native";
import { Text, TextInput, View, Pressable } from "react-native";
import { useState } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

const MAX_TAGS = 3;

export const TagInput = ({ value, onChange }: TagInputProps) => {
  const token = useColors();
  const [input, setInput] = useState("");

  const isAtLimit = value.length >= MAX_TAGS;
  const canAdd = input.trim().length > 0 && !isAtLimit;
  const handleAddTag = () => {
    const normalized = input.trim().toLowerCase();

    if (!normalized) return;

    if (value.length >= MAX_TAGS) return;

    if (value.includes(normalized)) {
      setInput("");
      return;
    }

    onChange([...value, normalized]);
    setInput("");
  };

  const handleRemoveTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Tag size={14} color={token.mutedForeground} />
        <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
          Tags
        </Text>
      </View>

      <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-bucket-border bg-bucket-muted px-4">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={isAtLimit ? "Max 3 tags reached" : "Add a tag"}
          placeholderTextColor={token.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleAddTag}
          className="flex-1 text-base text-bucket-foreground"
          editable={!isAtLimit}
        />

        {canAdd && (
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

      {value.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {value.map((t) => (
            <Pressable
              key={t}
              onPress={() => handleRemoveTag(t)}
              className="flex-row items-center gap-1 rounded-full border border-bucket-border bg-bucket-muted px-3 py-1.5"
            >
              <Text className="text-sm text-bucket-foreground">{t}</Text>
              <X size={12} color={token.mutedForeground} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};
