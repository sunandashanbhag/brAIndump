let Audio: any = null;

try {
  Audio = require("expo-av").Audio;
} catch {
  // expo-av not available
}

let recording: any = null;

export async function startRecording(): Promise<void> {
  if (!Audio) {
    console.warn("Audio recording not available in this environment");
    return;
  }

  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Microphone permission not granted");
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording: newRecording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  recording = newRecording;
}

export async function stopRecording(): Promise<{ uri: string; duration: number }> {
  if (!recording) throw new Error("No recording in progress");

  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = recording.getURI();
  const status = await recording.getStatusAsync();
  const duration = (status as any).durationMillis / 1000;

  recording = null;

  if (!uri) throw new Error("Recording failed — no URI");

  return { uri, duration };
}

export function isRecording(): boolean {
  return recording !== null;
}
