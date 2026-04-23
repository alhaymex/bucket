import { useQuery } from "convex/react";
import { FlatList, Pressable, Text, View } from "react-native";
import { api } from "@bucket/backend";
interface CollectionSelectorProps {
  selected: string | undefined;
  onSelect: (collectionId: string) => void;
}

export const CollectionSelector = ({
  onSelect,
  selected,
}: CollectionSelectorProps) => {
  const collections = useQuery(api.collections.queries.getUserCollections);

  if (collections === undefined) return <Text>Loading...</Text>;

  return (
    <View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={collections}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isActive = item._id === selected;
          return (
            <Pressable
              onPress={() => onSelect(item._id)}
              className={`border-[0.2px] rounded-full px-4 py-2 mx-1 ${
                isActive
                  ? "border-bucket-primary bg-bucket-primary-subtle"
                  : "bg-bucket-muted"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isActive ? "text-bucket-primary" : "text-bucket-foreground"
                }`}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
};
