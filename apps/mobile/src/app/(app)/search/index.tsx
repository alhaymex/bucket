import { Stack } from "expo-router";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Search() {
  return (
    <>
      <Stack.SearchBar placement="automatic" placeholder="Search" />
      <SafeAreaView className="flex-1 bg-bucket-background">
        <ScrollView></ScrollView>
      </SafeAreaView>
    </>
  );
}
