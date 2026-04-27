import { useColors } from "@/hooks/useColors";
import { X } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface FormHeaderProps {
  title: string;
  actionTitle: string;
  onClose: () => void;
  onSave: () => void;
  canSave?: boolean;
}

export const FormHeader = ({
  title,
  onSave,
  onClose,
  canSave,
}: FormHeaderProps) => {
  const token = useColors();
  return (
    <View>
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          <Pressable
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-bucket-muted"
          >
            <X size={16} color={token.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-bucket-foreground">
            {title}
          </Text>
        </View>
        <Pressable
          disabled={!canSave}
          className="rounded-full bg-bucket-primary px-4 py-2 disabled:opacity-50"
          onPress={onSave}
        >
          <Text className="text-sm font-semibold text-bucket-primary-foreground">
            Save
          </Text>
        </Pressable>
      </View>
      <View className="h-px bg-bucket-border" />
    </View>
  );
};
