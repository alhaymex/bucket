import { useColors } from "@/hooks/useColors";
import { useAuthFlowStore } from "@/store/authFlowStore";
import { ArrowRight, Mail } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppleLogoBlack from "@/assets/images/logos/apple-black.svg";
import AppleLogoWhite from "@/assets/images/logos/apple-white.svg";
import GoogleLogo from "@/assets/images/logos/google.svg";
import { useSignUp, useSSO } from "@clerk/expo";
import { useState } from "react";

type AuthAction = "oauth_google" | "oauth_apple" | "email" | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignUpScreen = () => {
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const { signUp } = useSignUp();
  const setAuthFlowEmail = useAuthFlowStore((state) => state.setEmail);

  const [activeAction, setActiveAction] = useState<AuthAction>(null);
  const loading = activeAction !== null;

  const [email, setEmail] = useState("");

  const token = useColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    setActiveAction(strategy);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
      });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
      }
    } catch (error) {
      Alert.alert(
        "Something went wrong",
        "Unable to sign in with the selected provider.",
      );
      console.error("OAuth Sign-In Error:", error);
    } finally {
      setActiveAction(null);
    }
  };

  const handleEmailSignUp = async () => {
    const trimmedEmail = email.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setActiveAction("email");

    try {
      const { error } = await signUp.create({ emailAddress: trimmedEmail });

      if (!error) {
        await signUp.verifications.sendEmailCode();
        setAuthFlowEmail(trimmedEmail);
        router.push("/(auth)/otp");
      }
    } catch (error) {
      Alert.alert(
        "Sign-Up Failed",
        "An error occurred while creating your account. Please try again.",
      );
      console.error("Email Sign-Up Error:", error);
    } finally {
      setActiveAction(null);
    }
  };

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
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <Pressable
                  className="h-14 flex-row disabled:opacity-50 items-center justify-center gap-2 rounded-2xl bg-bucket-primary px-4"
                  onPress={() => handleEmailSignUp()}
                  disabled={loading}
                >
                  {loading && activeAction === "email" ? (
                    <ActivityIndicator color={token.primaryForeground} />
                  ) : (
                    <>
                      <Text className="font-semibold text-bucket-primary-foreground">
                        Continue
                      </Text>
                      <ArrowRight size={18} color={token.primaryForeground} />
                    </>
                  )}
                </Pressable>

                <View className="flex-row items-center gap-4 py-2">
                  <View className="h-px flex-1 bg-bucket-border" />
                  <Text className="text-sm text-bucket-muted-foreground">
                    or
                  </Text>
                  <View className="h-px flex-1 bg-bucket-border" />
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    className="h-14 flex-1 flex-row disabled:opacity-50 items-center justify-center gap-2 rounded-2xl border border-bucket-border bg-bucket-muted px-4"
                    onPress={() => handleOAuth("oauth_google")}
                    disabled={loading && activeAction === "oauth_google"}
                  >
                    <View>
                      <GoogleLogo width={16} height={16} />
                    </View>
                    <Text className="text-lg mt-0.5 font-semibold text-bucket-foreground">
                      Google
                    </Text>
                  </Pressable>

                  <Pressable
                    className="h-14 flex-1 flex-row disabled:opacity-50 items-center justify-center gap-2 rounded-2xl border border-bucket-border bg-bucket-muted px-4"
                    onPress={() => handleOAuth("oauth_apple")}
                    disabled={loading && activeAction === "oauth_apple"}
                  >
                    <View>
                      {isDark ? (
                        <AppleLogoWhite width={16} height={16} />
                      ) : (
                        <AppleLogoBlack width={16} height={16} />
                      )}
                    </View>
                    <Text className="text-lg mt-0.5 font-semibold text-bucket-foreground">
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
