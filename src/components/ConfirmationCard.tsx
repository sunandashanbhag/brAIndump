import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Item } from "../types";

interface Props {
  items: Item[];
  onDismiss: () => void;
  onRecategorize: (itemId: string) => void;
}

export function ConfirmationCard({ items, onDismiss, onRecategorize }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Added {items.length} item{items.length !== 1 ? "s" : ""}</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.dismiss}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.confidence === "low" && (
                <Text style={styles.lowConfidence}>Needs review</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => onRecategorize(item.id)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", borderRadius: 16, padding: 20, margin: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, maxHeight: 300 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "600" },
  dismiss: { fontSize: 16, color: "#007AFF", fontWeight: "600" },
  list: { maxHeight: 200 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#eee" },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15 },
  lowConfidence: { fontSize: 12, color: "#FF9500", marginTop: 2 },
  editButton: { color: "#007AFF", fontSize: 14, marginLeft: 12 },
});
