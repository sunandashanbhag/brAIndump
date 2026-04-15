import { View, Text, TextInput, StyleSheet } from "react-native";
import { useCallback, useState } from "react";
import { RecordButton } from "../../src/components/RecordButton";
import { ConfirmationCard } from "../../src/components/ConfirmationCard";
import { useRecordingStore } from "../../src/stores/recordingStore";
import { useAuthStore } from "../../src/stores/authStore";
import { useCategoryStore } from "../../src/stores/categoryStore";
import * as recorder from "../../src/lib/recorder";
import * as transcriber from "../../src/lib/transcriber";

const speechAvailable = transcriber.isSpeechRecognitionAvailable();

export default function RecordScreen() {
  const session = useAuthStore((s) => s.session);
  const {
    status, transcript, result, error,
    setStatus, setTranscript, setAudioUri, categorize, reset,
  } = useRecordingStore();
  const { fetchCategories, fetchItems } = useCategoryStore();

  const [liveTranscript, setLiveTranscript] = useState("");
  const [manualText, setManualText] = useState("");

  // Only use speech recognition hook if available
  transcriber.useSpeechRecognitionEvent("result", (event: any) => {
    const text = event.results[0]?.transcript || "";
    setLiveTranscript(text);
    if (event.isFinal) {
      setTranscript(text);
    }
  });

  transcriber.useSpeechRecognitionEvent("end", () => {});

  const handlePress = useCallback(async () => {
    if (speechAvailable) {
      // Voice recording flow
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
    } else {
      // Text input fallback flow
      if (!manualText.trim()) return;

      reset();
      setTranscript(manualText);
      setStatus("categorizing");

      if (session?.user?.id) {
        // Set transcript directly in store then categorize
        useRecordingStore.setState({ transcript: manualText });
        await categorize(session.user.id);
        await fetchCategories(session.user.id);
        await fetchItems(session.user.id);
      }
      setManualText("");
    }
  }, [status, session, manualText]);

  const handleDismiss = () => {
    reset();
    setLiveTranscript("");
    setManualText("");
  };

  const statusText: Record<string, string> = {
    idle: speechAvailable ? "Tap to speak" : "Type your thoughts below",
    recording: "Listening...",
    transcribing: "Processing...",
    categorizing: "Organizing your thoughts...",
    done: "Done!",
    error: error || "Something went wrong",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>{statusText[status]}</Text>

      {speechAvailable && (status === "recording" || liveTranscript) && (
        <Text style={styles.transcript}>{liveTranscript || "Speak now..."}</Text>
      )}

      {!speechAvailable && (status === "idle" || status === "done" || status === "error") && (
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Buy milk and eggs, remind me to call Sarah on Friday"
          value={manualText}
          onChangeText={setManualText}
          multiline
          textAlignVertical="top"
        />
      )}

      <RecordButton
        isRecording={status === "recording"}
        onPress={handlePress}
        disabled={status === "transcribing" || status === "categorizing"}
      />

      {!speechAvailable && (
        <Text style={styles.fallbackNote}>
          Voice recording requires a development build. Using text input instead.
        </Text>
      )}

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
  statusText: { fontSize: 20, color: "#333", marginBottom: 24, fontWeight: "500" },
  transcript: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 32, paddingHorizontal: 24, maxHeight: 120 },
  textInput: {
    width: "100%",
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: "#fff",
  },
  fallbackNote: { fontSize: 12, color: "#999", marginTop: 16, textAlign: "center" },
});
