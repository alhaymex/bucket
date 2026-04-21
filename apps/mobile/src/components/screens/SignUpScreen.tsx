import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Mail } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";

const SignUpScreen = () => {
  const token = useColors();

  return (
    <SafeAreaView className="flex-1 bg-bucket-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-6 py-8">
            <View className="flex-1 justify-center gap-12">
              <View className="gap-3">
                <View className="self-start rounded-full bg-bucket-primary-subtle px-4 py-2">
                  <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-bucket-primary">
                    Bucket
                  </Text>
                </View>
                <Text className="text-4xl font-bold leading-[44px] text-bucket-foreground">
                  Create your{"\n"}account
                </Text>
              </View>

              <View className="gap-3">
                <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-bucket-border bg-bucket-muted px-4">
                  <Mail size={18} color={token.mutedForeground} />
                  <TextInput
                    className="flex-1 text-base text-bucket-foreground"
                    placeholder="Enter your email"
                    placeholderTextColor={token.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Pressable
                  className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-bucket-primary px-4"
                  onPress={Keyboard.dismiss}
                >
                  <Text className="font-semibold text-bucket-primary-foreground">
                    Continue
                  </Text>
                  <ArrowRight size={18} color={token.primaryForeground} />
                </Pressable>

                <View className="flex-row items-center gap-4 py-2">
                  <View className="h-px flex-1 bg-bucket-border" />
                  <Text className="text-sm text-bucket-muted-foreground">
                    or
                  </Text>
                  <View className="h-px flex-1 bg-bucket-border" />
                </View>

                <View className="flex-row gap-3">
                  <Pressable className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-bucket-border bg-bucket-muted px-4">
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-bucket-background">
                      <Text className="text-base font-bold text-bucket-foreground">
                        G
                      </Text>
                    </View>
                    <Text className="text-base font-semibold text-bucket-foreground">
                      Google
                    </Text>
                  </Pressable>

                  <Pressable className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-bucket-border bg-bucket-muted px-4">
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-bucket-background">
                      <Text className="text-base font-bold text-bucket-foreground">
                        A
                      </Text>
                    </View>
                    <Text className="text-base font-semibold text-bucket-foreground">
                      Apple
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <Text className="text-center text-sm leading-6 text-bucket-muted-foreground">
              By continuing, you agree to our{" "}
              <Text className="text-bucket-primary">Terms</Text>
              {" & "}
              <Text className="text-bucket-primary">Privacy</Text>
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
