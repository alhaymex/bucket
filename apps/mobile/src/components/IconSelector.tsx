import { useColors } from "@/hooks/useColors";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Briefcase,
  Clapperboard,
  DollarSign,
  Dumbbell,
  Gamepad2,
  Globe,
  Lightbulb,
  LucideIcon,
  Microscope,
  Music,
  Newspaper,
  Palette,
  Shapes,
  Sprout,
  UtensilsCrossed,
  Wrench,
} from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

export const collectionIconMap = {
  BookOpen,
  Palette,
  Briefcase,
  Wrench,
  Gamepad2,
  Globe,
  Music,
  Dumbbell,
  UtensilsCrossed,
  Lightbulb,
  Newspaper,
  Clapperboard,
  Microscope,
  DollarSign,
  Sprout,
} satisfies Record<string, LucideIcon>;

export type CollectionIconName = keyof typeof collectionIconMap;

interface IconSelectorProps {
  selected: CollectionIconName | undefined;
  onSelect: (icon: CollectionIconName | undefined) => void;
}

export const IconSelector = ({ selected, onSelect }: IconSelectorProps) => {
  const token = useColors();

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Shapes size={14} color={token.mutedForeground} />
        <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
          Icon
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-2"
      >
        <View className="flex-row gap-2 px-1">
          {Object.entries(collectionIconMap).map(([name, Icon]) => {
            const isActive = selected === name;

            return (
              <Pressable
                key={name}
                onPress={() => {
                  if (isActive) {
                    onSelect(undefined);
                  } else {
                    onSelect(name as CollectionIconName);
                  }
                }}
                className={cn(
                  "border-[0.2px] w-12 h-12 rounded-lg items-center justify-center",
                  isActive
                    ? "border-bucket-primary bg-bucket-primary-subtle"
                    : "bg-bucket-muted",
                )}
              >
                <Icon
                  size={16}
                  color={isActive ? token.primary : token.foreground}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};
