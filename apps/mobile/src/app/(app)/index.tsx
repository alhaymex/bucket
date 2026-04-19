import { View, Text, ScrollView, FlatList } from "react-native";
import React from "react";

const DUMMY_DATA = Array.from({ length: 100 }, (_, i) => `Item no: ${i + 1}`);

const Index = () => {
  return (
    <View>
      <FlatList
        data={DUMMY_DATA}
        renderItem={({ item }) => <Text>{item}</Text>}
      />
    </View>
  );
};

export default Index;
