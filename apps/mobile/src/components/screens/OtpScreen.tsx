import { useColors } from "@/hooks/useColors";
import { cn } from "@/lib/utils";
import { useAuthFlowStore } from "@/store/authFlowStore";
import { useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { SafeAreaView } from "react-native-safe-area-context";

const OTP_LENGTH = 6;

export const OtpScreen = ({ email }: { email: string }) => {
  const router = useRouter();
  const tokens = useColors();
  const { signUp } = useSignUp();

  const clearAuthFlowEmail = useAuthFlowStore((state) => state.clearEmail);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const isComplete = code.length === OTP_LENGTH;

  const handleCodeSubmit = async (submittedCode: string) => {
    console.log("Submitted code:", submittedCode);
    setLoading(true);

    if (!signUp) return;
    const otpCode = submittedCode ?? code;
    if (otpCode.length < OTP_LENGTH) {
      Alert.alert("Enter code", "Please enter the full 6-digit code.");
      return;
    }
    try {
      await signUp.verifications.verifyEmailCode({ code: otpCode });
      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;
            const url = decorateUrl("/");
            router.replace(url as "/");
          },
        });
      } else {
        console.log("Missing fields:", signUp.missingFields);
        console.log("signUp status after verify:", signUp.status);
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      Alert.alert("Invalid code", "Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseDifferentEmail = () => {
    clearAuthFlowEmail();
    router.replace("/(auth)/sign-up");
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

                <View className="gap-2">
                  <Text className="text-4xl font-bold leading-[44px] text-bucket-foreground">
                    Check your{"\n"}email
                  </Text>
                  <Text className="text-base leading-7 text-bucket-muted-foreground">
                    We sent a code to{" "}
                    <Text className="font-medium text-bucket-foreground">
                      {email}
                    </Text>
                  </Text>
                </View>
              </View>

              <View className="gap-5">
                <OtpInput
                  numberOfDigits={OTP_LENGTH}
                  autoFocus
                  blurOnFilled
                  type="numeric"
                  onTextChange={(text) => setCode(text.replace(/\D/g, ""))}
                  onFilled={(text) => handleCodeSubmit(text)}
                  placeholder="·"
                  theme={{
                    containerStyle: { width: "100%" },
                    pinCodeContainerStyle: {
                      height: 56,
                      width: 48,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: tokens.border,
                      backgroundColor: tokens.muted,
                    },
                    focusedPinCodeContainerStyle: {
                      borderColor: tokens.primary,
                    },
                    filledPinCodeContainerStyle: {
                      borderColor: tokens.border,
                      backgroundColor: tokens.muted,
                    },
                    pinCodeTextStyle: {
                      fontSize: 24,
                      fontWeight: "600",
                      color: tokens.foreground,
                    },
                    placeholderTextStyle: {
                      color: tokens.mutedForeground,
                    },
                    focusStickStyle: {
                      backgroundColor: tokens.primary,
                    },
                  }}
                  textInputProps={{
                    keyboardType:
                      Platform.OS === "ios" ? "number-pad" : "numeric",
                    textContentType: "oneTimeCode",
                    autoComplete: "one-time-code",
                    importantForAutofill: "yes",
                    accessibilityLabel: "One-time password",
                  }}
                />

                <Pressable
                  disabled={!isComplete || loading}
                  className={cn(
                    "flex-row gap-2 h-14 items-center justify-center rounded-2xl bg-bucket-primary px-4 ",
                    !isComplete || loading ? "opacity-40" : "",
                  )}
                  onPress={() => handleCodeSubmit(code)}
                >
                  {loading && <ActivityIndicator color="white" />}
                  <Text className="text-base font-semibold text-bucket-primary-foreground">
                    Verify
                  </Text>
                </Pressable>

                <View className="items-center gap-3">
                  <Pressable>
                    <Text className="text-base font-semibold text-bucket-primary">
                      Resend code
                    </Text>
                  </Pressable>

                  <Pressable onPress={handleUseDifferentEmail}>
                    <Text className="text-sm text-bucket-muted-foreground">
                      Use a different email
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
