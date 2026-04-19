import { ScrollView } from "react-native";
import { Stack } from "expo-router";

export default function SearchIndex() {
  return (
    <>
      <Stack.Screen.Title>Search</Stack.Screen.Title>
      <Stack.SearchBar
        placement="automatic"
        placeholder="Search"
        onChangeText={() => {}}
      />
      <ScrollView>{/* Screen content */}</ScrollView>
    </>
  );
}
