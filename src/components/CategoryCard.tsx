import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Category } from "../types";

interface Props {
  category: Category;
  itemCount: number;
  pendingCount: number;
}

export function CategoryCard({ category, itemCount, pendingCount }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (category.name === "Health & Fitness") {
          router.push("/health");
        } else {
          router.push(`/category/${category.id}`);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.info}>
        <Text style={styles.name}>{category.name}</Text>
        <Text style={styles.count}>
          {pendingCount} pending{itemCount > pendingCount ? ` / ${itemCount} total` : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, marginHorizontal: 16, marginVertical: 6, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
  count: { fontSize: 13, color: "#888" },
});
