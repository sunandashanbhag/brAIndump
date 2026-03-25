import { TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRef, useEffect } from "react";

interface Props {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function RecordButton({ isRecording, onPress, disabled }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scale.setValue(1);
    }
  }, [isRecording]);

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.button,
          isRecording && styles.recording,
          disabled && styles.disabled,
          { transform: [{ scale }] },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#FF3B30", shadowColor: "#FF3B30", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  recording: { backgroundColor: "#FF6B6B" },
  disabled: { opacity: 0.5 },
});
