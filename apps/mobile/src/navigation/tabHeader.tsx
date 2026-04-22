import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import { CircleUserRound, Plus } from "lucide-react-native";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";

type HeaderActionHandlers = {
  onAdd: (event?: GestureResponderEvent) => void;
  onProfile: (event?: GestureResponderEvent) => void;
};

export const TAB_ROOT_STACK_SCREEN_OPTIONS = {
  headerLargeTitleEnabled: true,
  headerTitleStyle: { color: "white" },
  headerLargeTitleStyle: { fontSize: 35 },
};

export function getIOSHeaderRightItems({
  onAdd,
  onProfile,
}: HeaderActionHandlers) {
  return [
    {
      type: "button" as const,
      label: "Add",
      icon: {
        type: "sfSymbol" as const,
        name: "plus" as const,
      },
      onPress: onAdd,
      variant: "plain" as const,
      sharesBackground: false,
    },
    {
      type: "button" as const,
      label: "Profile",
      icon: {
        type: "sfSymbol" as const,
        name: "person.fill" as const,
      },
      onPress: onProfile,
      variant: "plain" as const,
      sharesBackground: false,
    },
  ];
}

function TabHeaderActions({ onAdd, onProfile }: HeaderActionHandlers) {
  const colors = useColors();

  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityLabel="Add"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onAdd}
        style={styles.actionButton}
      >
        <Plus color={colors.foreground} size={20} strokeWidth={2.25} />
        <Text style={[styles.actionLabel, { color: colors.foreground }]}>Add</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Profile"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onProfile}
        style={styles.actionButton}
      >
        <CircleUserRound
          color={colors.foreground}
          size={20}
          strokeWidth={2.25}
        />
        <Text style={[styles.actionLabel, { color: colors.foreground }]}>
          Profile
        </Text>
      </Pressable>
    </View>
  );
}

export function useTabRootScreenOptions(title: string) {
  const router = useRouter();

  const onAdd = () => {
    router.push("/add");
  };

  const onProfile = () => {
    router.push("/profile");
  };

  if (Platform.OS === "ios") {
    return {
      title,
      unstable_headerRightItems: () =>
        getIOSHeaderRightItems({ onAdd, onProfile }),
    };
  }

  return {
    title,
    headerRight: () => <TabHeaderActions onAdd={onAdd} onProfile={onProfile} />,
  };
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
