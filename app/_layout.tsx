import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { useAuthStore } from "../src/stores/authStore";
import { useRecordingStore } from "../src/stores/recordingStore";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { registerForPushNotifications } from "../src/lib/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const { session, loading, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
    registerForPushNotifications();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      const checkOnboarding = async () => {
        const onboarded = await AsyncStorage.getItem("onboarding_complete");
        if (!onboarded) {
          router.replace("/onboarding");
        } else {
          router.replace("/(tabs)");
        }
      };
      checkOnboarding();
    }
  }, [session, loading, segments]);

  // Process offline queue when connectivity is restored
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && session?.user?.id) {
        useRecordingStore.getState().processQueue(session.user.id);
      }
    });
    return () => unsubscribe();
  }, [session]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="category/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="item/[id]" options={{ headerShown: true, presentation: "modal" }} />
        <Stack.Screen name="health" options={{ headerShown: true }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
