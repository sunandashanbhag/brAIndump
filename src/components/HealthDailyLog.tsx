import { View, Text, StyleSheet } from "react-native";
import { HealthEntry, FoodDetails, ExerciseDetails } from "../types";

interface Props {
  date: string;
  entries: HealthEntry[];
}

export function HealthDailyLog({ date, entries }: Props) {
  const dateLabel = new Date(date).toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{dateLabel}</Text>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.entry}>
          <Text style={styles.entryType}>{entry.type === "food" ? "\u{1F37D}" : "\u{1F4AA}"}</Text>
          <Text style={styles.entryDetail}>
            {entry.type === "food"
              ? `${(entry.details as FoodDetails).meal}: ${(entry.details as FoodDetails).description}`
              : `${(entry.details as ExerciseDetails).activity}${
                  (entry.details as ExerciseDetails).duration_minutes
                    ? ` \u2014 ${(entry.details as ExerciseDetails).duration_minutes} min`
                    : ""
                }`}
          </Text>
        </View>
      ))}
      {entries.length === 0 && <Text style={styles.noEntries}>No entries</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 16 },
  date: { fontSize: 15, fontWeight: "600", marginBottom: 8, color: "#333" },
  entry: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 4 },
  entryType: { fontSize: 18, marginRight: 10 },
  entryDetail: { fontSize: 15, color: "#444", flex: 1 },
  noEntries: { fontSize: 14, color: "#999", fontStyle: "italic", paddingHorizontal: 12 },
});
