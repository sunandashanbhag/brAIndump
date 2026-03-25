import { useEffect } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useAuthStore } from "../../src/stores/authStore";
import { useCategoryStore } from "../../src/stores/categoryStore";
import { CategoryCard } from "../../src/components/CategoryCard";

export default function HomeScreen() {
  const session = useAuthStore((s) => s.session);
  const {
    categories, items, loading,
    fetchCategories, fetchItems, seedCategories,
    getTopLevelCategories, getItemsByCategory, getSubCategories,
  } = useCategoryStore();

  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    await fetchCategories(userId);
    const state = useCategoryStore.getState();
    if (state.categories.length === 0) {
      await seedCategories(userId);
    }
    await fetchItems(userId);
  };

  const topLevelCategories = getTopLevelCategories();

  const getCategoryItemCount = (categoryId: string) => {
    const subCats = getSubCategories(categoryId);
    const allCategoryIds = [categoryId, ...subCats.map((c) => c.id)];
    const categoryItems = items.filter((i) => allCategoryIds.includes(i.category_id));
    return {
      total: categoryItems.length,
      pending: categoryItems.filter((i) => i.status === "pending").length,
    };
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={topLevelCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const counts = getCategoryItemCount(item.id);
          return <CategoryCard category={item} itemCount={counts.total} pendingCount={counts.pending} />;
        }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No categories yet. Record a voice note to get started!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  list: { paddingVertical: 12 },
  empty: { padding: 48, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#999", textAlign: "center" },
});
