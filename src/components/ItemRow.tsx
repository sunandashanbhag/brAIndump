import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { Item } from "../types";

interface Props {
  item: Item;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
}

export function ItemRow({ item, onToggle, onDelete, onPress }: Props) {
  const renderRightActions = () => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => onDelete(item.id)}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity style={styles.row} onPress={() => onPress(item.id)} activeOpacity={0.7}>
        <TouchableOpacity style={styles.checkbox} onPress={() => onToggle(item.id)}>
          <Ionicons
            name={item.status === "done" ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={item.status === "done" ? "#34C759" : "#ccc"}
          />
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={[styles.title, item.status === "done" && styles.doneTitle]}>{item.title}</Text>
          {item.reminder_at && (
            <Text style={styles.reminder}>Reminder: {new Date(item.reminder_at).toLocaleDateString()}</Text>
          )}
          {item.confidence === "low" && <Text style={styles.lowConfidence}>Needs review</Text>}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#eee" },
  checkbox: { marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 16 },
  doneTitle: { textDecorationLine: "line-through", color: "#999" },
  reminder: { fontSize: 12, color: "#007AFF", marginTop: 4 },
  lowConfidence: { fontSize: 12, color: "#FF9500", marginTop: 2 },
  deleteAction: { backgroundColor: "#FF3B30", justifyContent: "center", alignItems: "center", width: 80 },
  deleteText: { color: "#fff", fontWeight: "600" },
});
