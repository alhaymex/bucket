import { cn } from "@/lib/utils";
import { View, ViewProps } from "react-native";

function Skeleton({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("animate-pulse rounded-md bg-bucket-border", className)}
      {...props}
    />
  );
}

export { Skeleton };
