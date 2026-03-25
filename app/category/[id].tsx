import { useLocalSearchParams, Stack } from "expo-router";
import { View, Text, SectionList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useCategoryStore } from "../../src/stores/categoryStore";
import { ItemRow } from "../../src/components/ItemRow";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { categories, getItemsByCategory, getSubCategories, toggleItemDone, deleteItem } = useCategoryStore();

  const category = categories.find((c) => c.id === id);
  const subCategories = getSubCategories(id!);

  const topLevelItems = getItemsByCategory(id!);
  const sections = [
    ...(topLevelItems.length > 0 ? [{ title: "", data: topLevelItems }] : []),
    ...subCategories.map((sub) => ({
      title: sub.name,
      data: getItemsByCategory(sub.id),
    })),
  ].filter((s) => s.data.length > 0);

  return (
    <>
      <Stack.Screen options={{ title: category?.name || "Category" }} />
      <View style={styles.container}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemRow
              item={item}
              onToggle={toggleItemDone}
              onDelete={deleteItem}
              onPress={(itemId) => router.push(`/item/${itemId}`)}
            />
          )}
          renderSectionHeader={({ section: { title } }) =>
            title ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}><Text style={styles.emptyText}>No items yet</Text></View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  sectionHeader: { backgroundColor: "#F0F0F0", padding: 10, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#666", textTransform: "uppercase" },
  empty: { padding: 48, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#999" },
});
