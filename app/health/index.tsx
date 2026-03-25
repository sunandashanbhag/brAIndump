import { useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useAuthStore } from "../../src/stores/authStore";
import { useHealthStore } from "../../src/stores/healthStore";
import { WeeklySummaryCard } from "../../src/components/WeeklySummaryCard";
import { HealthDailyLog } from "../../src/components/HealthDailyLog";

export default function HealthScreen() {
  const session = useAuthStore((s) => s.session);
  const { entries, fetchEntries, getEntriesForDate } = useHealthStore();

  useEffect(() => {
    if (session?.user?.id) {
      fetchEntries(session.user.id);
    }
  }, [session]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString();
  });

  return (
    <>
      <Stack.Screen options={{ title: "Health & Fitness" }} />
      <ScrollView style={styles.container}>
        <WeeklySummaryCard entries={entries} />
        {days.map((day) => (
          <HealthDailyLog key={day} date={day} entries={getEntriesForDate(day)} />
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
});
