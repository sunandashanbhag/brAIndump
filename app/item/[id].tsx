import { useState } from "react";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useCategoryStore } from "../../src/stores/categoryStore";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, categories, deleteItem, updateItemCategory } = useCategoryStore();

  const item = items.find((i) => i.id === id);
  const [selectedCategoryId, setSelectedCategoryId] = useState(item?.category_id || "");

  if (!item) {
    return <View style={styles.container}><Text>Item not found</Text></View>;
  }

  const topLevelCategories = categories.filter((c) => c.parent_id === null);

  const handleRecategorize = async () => {
    if (selectedCategoryId !== item.category_id) {
      await updateItemCategory(item.id, selectedCategoryId);
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("Delete item", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteItem(item.id); router.back(); } },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Item Details" }} />
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Title</Text>
        <Text style={styles.title}>{item.title}</Text>

        {item.raw_transcript ? (
          <>
            <Text style={styles.label}>Original transcript</Text>
            <Text style={styles.transcript}>{item.raw_transcript}</Text>
          </>
        ) : null}

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryList}>
          {topLevelCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategoryId === cat.id && styles.selectedChip]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text style={[styles.chipText, selectedCategoryId === cat.id && styles.selectedChipText]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedCategoryId !== item.category_id && (
          <TouchableOpacity style={styles.saveButton} onPress={handleRecategorize}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Item</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#888", textTransform: "uppercase", marginTop: 20, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "500" },
  transcript: { fontSize: 14, color: "#666", fontStyle: "italic" },
  categoryList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F0F0F0" },
  selectedChip: { backgroundColor: "#007AFF" },
  chipText: { fontSize: 14, color: "#333" },
  selectedChipText: { color: "#fff" },
  saveButton: { backgroundColor: "#007AFF", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  deleteButton: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16 },
  deleteButtonText: { color: "#FF3B30", fontSize: 16, fontWeight: "500" },
});
