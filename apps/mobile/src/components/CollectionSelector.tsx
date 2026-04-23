import { FlatList, Pressable, Text, View } from "react-native";

interface CollectionSelectorProps {
  selected: string | undefined;
  onSelect: (collectionId: string) => void;
}

const DUMMY_COLLECTIONS: {
  _id: string;
  name: string;
}[] = [
  {
    _id: "random_id_1",
    name: "Reading List",
  },
  {
    _id: "random_id_2",
    name: "Design",
  },
  {
    _id: "random_id_3",
    name: "Dev",
  },
  {
    _id: "random_id_4",
    name: "Inspiration",
  },
  {
    _id: "random_id_5",
    name: "Work",
  },
];

export const CollectionSelector = ({
  onSelect,
  selected,
}: CollectionSelectorProps) => {
  return (
    <View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={DUMMY_COLLECTIONS}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isActive = item._id === selected;
          return (
            <Pressable
              onPress={() => onSelect(item._id)}
              className={`rounded-full border px-4 py-2 mx-1 ${
                isActive
                  ? "border-bucket-primary bg-bucket-primary-subtle"
                  : "border-bucket-border bg-bucket-muted"
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
