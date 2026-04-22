import { OtpScreen } from "@/components/screens/OtpScreen";
import { useAuthFlowStore } from "@/store/authFlowStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";

const Otp = () => {
  const router = useRouter();
  const email = useAuthFlowStore((state) => state.email);

  useEffect(() => {
    if (!email) {
      router.replace("/(auth)/sign-up");
    }
  }, [email, router]);

  if (!email) {
    return null;
  }

  return <OtpScreen email={email} />;
};

export default Otp;
