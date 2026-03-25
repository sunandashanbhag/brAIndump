import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Item, Category } from "../types";

interface Props {
  item: Item;
  categories: Category[];
  onSelect: (itemId: string, categoryId: string) => void;
  onDismiss: (itemId: string) => void;
}

export function NudgePrompt({ item, categories, onSelect, onDismiss }: Props) {
  const topLevel = categories.filter((c) => c.parent_id === null);

  return (
    <View style={styles.container}>
      <Text style={styles.question}>Where does "{item.title}" belong?</Text>
      <View style={styles.options}>
        {topLevel.slice(0, 4).map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.option} onPress={() => onSelect(item.id, cat.id)}>
            <Text style={styles.optionText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.dismiss} onPress={() => onDismiss(item.id)}>
        <Text style={styles.dismissText}>Keep as is</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#FFF9E6", borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: "#FFE082" },
  question: { fontSize: 15, fontWeight: "500", marginBottom: 12 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd" },
  optionText: { fontSize: 14, color: "#333" },
  dismiss: { marginTop: 12, alignSelf: "center" },
  dismissText: { fontSize: 13, color: "#999" },
});
