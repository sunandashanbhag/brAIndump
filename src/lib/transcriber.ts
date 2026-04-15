let ExpoSpeechRecognitionModule: any = null;
let _useSpeechRecognitionEvent: any = null;

try {
  const mod = require("expo-speech-recognition");
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  _useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
  // Native module not available (Expo Go / simulator without dev build)
}

export async function requestTranscriptionPermission(): Promise<boolean> {
  if (!ExpoSpeechRecognitionModule) {
    console.warn("Speech recognition not available — using text input fallback");
    return true;
  }
  const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return result.granted;
}

export function startTranscription(): void {
  if (!ExpoSpeechRecognitionModule) return;
  ExpoSpeechRecognitionModule.start({
    lang: "en-US",
    interimResults: true,
    continuous: true,
  });
}

export function stopTranscription(): void {
  if (!ExpoSpeechRecognitionModule) return;
  ExpoSpeechRecognitionModule.stop();
}

export function isSpeechRecognitionAvailable(): boolean {
  return ExpoSpeechRecognitionModule !== null;
}

// No-op hook fallback when native module isn't available
const noopHook = (_event: string, _callback: any) => {};

export const useSpeechRecognitionEvent = _useSpeechRecognitionEvent || noopHook;
