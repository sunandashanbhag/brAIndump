import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuthStore } from "../../src/stores/authStore";

export default function SettingsScreen() {
  const { session, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{session?.user?.email}</Text>
      </View>
      <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 20 },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 13, color: "#888", textTransform: "uppercase", marginBottom: 4 },
  value: { fontSize: 16 },
  signOut: { backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  signOutText: { color: "#FF3B30", fontSize: 16, fontWeight: "500" },
});
