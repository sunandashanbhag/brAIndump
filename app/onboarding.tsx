import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SLIDES = [
  {
    title: "Dump your thoughts",
    description: "Just talk. brAIndump captures your voice and turns it into organized actions, lists, and logs.",
  },
  {
    title: "Everything in its place",
    description: "Your thoughts are automatically sorted into categories — groceries, work tasks, health tracking, and more.",
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const router = useRouter();

  const handleNext = async () => {
    if (page < SLIDES.length - 1) {
      setPage(page + 1);
    } else {
      await AsyncStorage.setItem("onboarding_complete", "true");
      router.replace("/(tabs)");
    }
  };

  const slide = SLIDES[page];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.activeDot]} />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{page === SLIDES.length - 1 ? "Get Started" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "space-between", padding: 24 },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  description: { fontSize: 17, color: "#666", textAlign: "center", lineHeight: 24, paddingHorizontal: 20 },
  footer: { alignItems: "center", paddingBottom: 20 },
  dots: { flexDirection: "row", marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ddd", marginHorizontal: 4 },
  activeDot: { backgroundColor: "#007AFF", width: 24 },
  button: { backgroundColor: "#007AFF", borderRadius: 12, paddingVertical: 16, paddingHorizontal: 48 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
