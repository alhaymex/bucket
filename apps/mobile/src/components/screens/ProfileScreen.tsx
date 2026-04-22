import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  FolderOpen,
  Link2,
  LogOut,
  Mail,
  MoonStar,
  Shield,
  Tag,
  UserRound,
  X,
} from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PROFILE_STATS = [
  { label: "Saved", value: "148", icon: Link2 },
  { label: "Collections", value: "12", icon: FolderOpen },
  { label: "Tags", value: "34", icon: Tag },
] as const;

const SETTINGS_GROUPS = [
  {
    title: "Account",
    items: [
      {
        label: "Email",
        value: "alhaymex@example.com",
        icon: Mail,
      },
      {
        label: "Profile details",
        value: "Name, username, avatar",
        icon: UserRound,
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        label: "Notifications",
        value: "Smart reminders enabled",
        icon: Bell,
      },
      {
        label: "Appearance",
        value: "System theme",
        icon: MoonStar,
      },
      {
        label: "Privacy",
        value: "Manage connected devices",
        icon: Shield,
      },
    ],
  },
] as const;

export const ProfileScreen = () => {
  const token = useColors();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bucket-background" edges={["bottom"]}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-bucket-muted"
        >
          <X size={16} color={token.foreground} />
        </Pressable>
        <Text className="text-base font-semibold text-bucket-foreground">
          Profile
        </Text>
        <View className="w-9" />
      </View>

      <View className="h-px bg-bucket-border" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          <View className="flex-row gap-3">
            {PROFILE_STATS.map((stat) => {
              const Icon = stat.icon;

              return (
                <View
                  key={stat.label}
                  className="flex-1 gap-3 rounded-2xl border border-bucket-border bg-bucket-muted p-2"
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-bucket-primary-subtle">
                    <Icon size={16} color={token.primary} />
                  </View>
                  <View className="gap-1">
                    <Text className="text-xl font-bold text-bucket-foreground">
                      {stat.value}
                    </Text>
                    <Text className="text-sm text-bucket-muted-foreground">
                      {stat.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {SETTINGS_GROUPS.map((group) => (
          <View key={group.title} className="gap-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-bucket-muted-foreground">
                {group.title}
              </Text>
            </View>

            <View className="overflow-hidden rounded-2xl border border-bucket-border bg-bucket-muted">
              {group.items.map((item, index) => {
                const Icon = item.icon;
                const isLast = index === group.items.length - 1;

                return (
                  <Pressable
                    key={item.label}
                    className={`flex-row items-center gap-3 px-4 py-4 ${
                      !isLast ? "border-b border-bucket-border" : ""
                    }`}
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-bucket-background">
                      <Icon size={16} color={token.foreground} />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className="text-sm font-semibold text-bucket-foreground">
                        {item.label}
                      </Text>
                      <Text className="text-sm text-bucket-muted-foreground">
                        {item.value}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={token.mutedForeground} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <Pressable className="flex-row items-center justify-center gap-2 rounded-2xl border border-bucket-border bg-bucket-muted px-4 py-4">
          <LogOut size={16} color={token.dead} />
          <Text className="text-sm font-semibold text-bucket-dead">
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};
