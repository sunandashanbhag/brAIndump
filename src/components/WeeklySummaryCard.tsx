import { View, Text, StyleSheet } from "react-native";
import { HealthEntry } from "../types";

interface Props {
  entries: HealthEntry[];
}

export function WeeklySummaryCard({ entries }: Props) {
  const exerciseCount = entries.filter((e) => e.type === "exercise").length;
  const foodCount = entries.filter((e) => e.type === "food").length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>This Week</Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{exerciseCount}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{foodCount}</Text>
          <Text style={styles.statLabel}>Meals Logged</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#E8F5E9", borderRadius: 16, padding: 20, margin: 16 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  stats: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statNumber: { fontSize: 28, fontWeight: "bold", color: "#2E7D32" },
  statLabel: { fontSize: 13, color: "#666", marginTop: 4 },
});
