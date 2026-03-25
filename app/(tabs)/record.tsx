import { View, Text, StyleSheet } from "react-native";
import { useCallback, useState } from "react";
import { useSpeechRecognitionEvent } from "expo-speech-recognition";
import { RecordButton } from "../../src/components/RecordButton";
import { ConfirmationCard } from "../../src/components/ConfirmationCard";
import { useRecordingStore } from "../../src/stores/recordingStore";
import { useAuthStore } from "../../src/stores/authStore";
import { useCategoryStore } from "../../src/stores/categoryStore";
import * as recorder from "../../src/lib/recorder";
import * as transcriber from "../../src/lib/transcriber";

export default function RecordScreen() {
  const session = useAuthStore((s) => s.session);
  const {
    status, transcript, result, error,
    setStatus, setTranscript, setAudioUri, categorize, reset,
  } = useRecordingStore();
  const { fetchCategories, fetchItems } = useCategoryStore();

  const [liveTranscript, setLiveTranscript] = useState("");

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript || "";
    setLiveTranscript(text);
    if (event.isFinal) {
      setTranscript(text);
    }
  });

  useSpeechRecognitionEvent("end", () => {});

  const handlePress = useCallback(async () => {
    if (status === "recording") {
      transcriber.stopTranscription();
      const { uri, duration } = await recorder.stopRecording();
      setAudioUri(uri, duration);
      setStatus("transcribing");

      if (session?.user?.id) {
        await categorize(session.user.id);
        await fetchCategories(session.user.id);
        await fetchItems(session.user.id);
      }
    } else if (status === "idle" || status === "done" || status === "error") {
      reset();
      setLiveTranscript("");
      setStatus("recording");

      const hasPermission = await transcriber.requestTranscriptionPermission();
      if (!hasPermission) {
        setStatus("error");
        return;
      }

      await recorder.startRecording();
      transcriber.startTranscription();
    }
  }, [status, session]);

  const handleDismiss = () => {
    reset();
    setLiveTranscript("");
  };

  const statusText: Record<string, string> = {
    idle: "Tap to speak",
    recording: "Listening...",
    transcribing: "Processing...",
    categorizing: "Organizing your thoughts...",
    done: "Done!",
    error: error || "Something went wrong",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>{statusText[status]}</Text>
      {(status === "recording" || liveTranscript) && (
        <Text style={styles.transcript}>{liveTranscript || "Speak now..."}</Text>
      )}
      <RecordButton
        isRecording={status === "recording"}
        onPress={handlePress}
        disabled={status === "transcribing" || status === "categorizing"}
      />
      {status === "done" && result && result.items.length > 0 && (
        <ConfirmationCard
          items={result.items as any}
          onDismiss={handleDismiss}
          onRecategorize={() => {}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA", padding: 24 },
  statusText: { fontSize: 20, color: "#333", marginBottom: 48, fontWeight: "500" },
  transcript: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 32, paddingHorizontal: 24, maxHeight: 120 },
});
