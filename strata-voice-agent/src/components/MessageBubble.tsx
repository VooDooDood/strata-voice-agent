/**
 * Message Bubble
 * Displays user transcripts and AI responses
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme/colors';

interface MessageBubbleProps {
  type: 'user' | 'assistant';
  text: string;
  onPress?: () => void;
  isSpeaking?: boolean;
}

export function MessageBubble({ type, text, onPress, isSpeaking }: MessageBubbleProps) {
  const isUser = type === 'user';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          isSpeaking && styles.speakingBubble,
        ]}
      >
        <Text style={[styles.text, isUser && styles.userText]}>
          {text}
        </Text>
        {!isUser && (
          <Text style={styles.hint}>
            {isSpeaking ? '🔊 Speaking...' : '👆 Tap to replay'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  speakingBubble: {
    borderColor: colors.speaking,
    borderWidth: 2,
  },
  text: {
    ...typography.body,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
});
