/**
 * Home Screen
 * Main voice chat interface with push-to-talk
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  SafeAreaView,
  Pressable,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { PushToTalkButton } from '../components/PushToTalkButton';
import { MessageBubble } from '../components/MessageBubble';
import { useSettings } from '../core/settings/SettingsContext';
import { googleSttProvider } from '../core/voice/providers/GoogleSttProvider';
import { googleTtsProvider } from '../core/voice/providers/GoogleTtsProvider';
import { n8nMcpProvider } from '../core/backend/providers/N8nMcpProvider';
import { colors, spacing, typography, borderRadius } from '../theme/colors';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
}

export function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { settings, updateSettings } = useSettings();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [pttMode, setPttMode] = useState<'hold' | 'toggle'>(settings.pttMode || 'hold');

  // Configure backend with settings
  useEffect(() => {
    n8nMcpProvider.configure({
      url: settings.n8nMcpUrl,
      token: settings.n8nMcpToken,
      cfClientId: settings.cfClientId,
      cfClientSecret: settings.cfClientSecret,
      workflowId: settings.selectedWorkflowId,
    });
  }, [settings]);

  // Handle speech recognition events
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript || '';
    const isFinal = event.isFinal;
    
    googleSttProvider.handleResult(transcript, isFinal);
    
    if (!isFinal) {
      setPartialTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    googleSttProvider.handleError(new Error(event.error));
    setIsRecording(false);
    setIsProcessing(false);
  });

  const handlePressIn = useCallback(async () => {
    try {
      setIsRecording(true);
      setPartialTranscript('');
      googleSttProvider.onPartialResult = (text) => setPartialTranscript(text);
      await googleSttProvider.startListening();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, []);

  const handlePressOut = useCallback(async () => {
    setIsRecording(false);
    setIsProcessing(true);

    try {
      const transcript = await googleSttProvider.stopListening();
      
      if (transcript.trim()) {
        // Add user message
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          type: 'user',
          text: transcript,
        };
        setMessages((prev) => [...prev, userMessage]);
        setPartialTranscript('');

        // Send to backend
        const response = await n8nMcpProvider.sendMessage(transcript);

        // Add assistant message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          text: response,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Speak the response
        await speakResponse(response, assistantMessage.id);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        text: `Sorry, something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const speakResponse = async (text: string, messageId: string) => {
    try {
      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
      await googleTtsProvider.speak(text);
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const handleMessagePress = (message: Message) => {
    if (message.type === 'assistant' && !isSpeaking) {
      speakResponse(message.text, message.id);
    }
  };

  // Stop TTS playback
  const handleStopSpeaking = useCallback(() => {
    googleTtsProvider.stop();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  // Toggle recording (for toggle mode)
  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording and process
      await handlePressOut();
    } else {
      // Start recording
      await handlePressIn();
    }
  }, [isRecording, handlePressIn, handlePressOut]);

  // Toggle PTT mode
  const handleTogglePttMode = useCallback((value: boolean) => {
    const newMode = value ? 'toggle' : 'hold';
    setPttMode(newMode);
    updateSettings({ pttMode: newMode });
  }, [updateSettings]);

  const isConfigured = settings.n8nMcpToken && settings.n8nMcpUrl;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Strata Voice</Text>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && !partialTranscript && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎙️</Text>
            <Text style={styles.emptyTitle}>Ready to listen</Text>
            <Text style={styles.emptySubtitle}>
              {isConfigured
                ? pttMode === 'hold'
                  ? 'Hold the button below and speak'
                  : 'Tap to start, tap again to stop'
                : 'Configure your connection in Settings first'}
            </Text>
          </View>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            type={message.type}
            text={message.text}
            onPress={() => handleMessagePress(message)}
            isSpeaking={speakingMessageId === message.id}
          />
        ))}

        {/* Partial transcript preview */}
        {partialTranscript && (
          <View style={styles.partialContainer}>
            <Text style={styles.partialLabel}>Listening...</Text>
            <Text style={styles.partialText}>{partialTranscript}</Text>
          </View>
        )}
      </ScrollView>

      {/* PTT Button */}
      <View style={styles.buttonContainer}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <Text style={styles.modeLabel}>Hold</Text>
          <Switch
            value={pttMode === 'toggle'}
            onValueChange={handleTogglePttMode}
            trackColor={{ false: colors.surface, true: colors.primary }}
            thumbColor={colors.text}
          />
          <Text style={styles.modeLabel}>Toggle</Text>
        </View>

        <PushToTalkButton
          isRecording={isRecording}
          isProcessing={isProcessing}
          mode={pttMode}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onToggle={handleToggleRecording}
        />

        {/* Stop Button - visible when speaking */}
        {isSpeaking && (
          <Pressable style={styles.stopButton} onPress={handleStopSpeaking}>
            <Text style={styles.stopButtonText}>⏹ Stop</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  title: {
    ...typography.h2,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  settingsIcon: {
    fontSize: 24,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
  partialContainer: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
  },
  partialLabel: {
    ...typography.caption,
    color: colors.primaryLight,
    marginBottom: spacing.xs,
  },
  partialText: {
    ...typography.body,
    fontStyle: 'italic',
  },
  buttonContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  modeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stopButton: {
    marginTop: spacing.md,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  stopButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
});
