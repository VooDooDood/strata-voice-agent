/**
 * Push-to-Talk Button
 * Animated button with visual feedback for recording state
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import { colors, borderRadius, spacing } from '../theme/colors';

interface PushToTalkButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  mode: 'hold' | 'toggle';
  onPressIn: () => void;
  onPressOut: () => void;
  onToggle: () => void;
}

export function PushToTalkButton({
  isRecording,
  isProcessing,
  mode,
  onPressIn,
  onPressOut,
  onToggle,
}: PushToTalkButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation | null = null;

    if (isRecording) {
      // Pulsing animation while recording (use JS driver to avoid conflicts)
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      );
      pulseAnimation.start();

      // Glow animation
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      // Reset animations
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }).start();

      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isRecording, pulseAnim, glowAnim]);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.recordingGlow],
  });

  const buttonColor = isRecording ? colors.recording : colors.primary;

  // Different text based on mode
  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (isRecording) return 'Listening...';
    return mode === 'hold' ? 'Hold to Speak' : 'Tap to Speak';
  };

  // For toggle mode, use onPress; for hold mode, use onPressIn/onPressOut
  const pressProps = mode === 'toggle'
    ? { onPress: onToggle }
    : { onPressIn, onPressOut };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glowRing,
          {
            backgroundColor: glowColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.buttonWrapper,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Pressable
          style={[
            styles.button,
            { backgroundColor: buttonColor },
          ]}
          {...pressProps}
          disabled={isProcessing}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.micIcon}>{isRecording ? '🔴' : '🎤'}</Text>
          </View>
          <Text style={styles.buttonText}>{getButtonText()}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  buttonWrapper: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  micIcon: {
    fontSize: 48,
  },
  buttonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
