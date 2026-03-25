import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export async function requestTranscriptionPermission(): Promise<boolean> {
  const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return result.granted;
}

export function startTranscription(): void {
  ExpoSpeechRecognitionModule.start({
    lang: "en-US",
    interimResults: true,
    continuous: true,
  });
}

export function stopTranscription(): void {
  ExpoSpeechRecognitionModule.stop();
}

export { useSpeechRecognitionEvent };
