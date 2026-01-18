/**
 * Settings Screen
 * Configure backend connection and voice options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';

import { useSettings } from '../core/settings/SettingsContext';
import { n8nMcpProvider } from '../core/backend/providers/N8nMcpProvider';
import { googleTtsProvider } from '../core/voice/providers/GoogleTtsProvider';
import { Voice } from '../core/types';
import { colors, spacing, typography, borderRadius } from '../theme/colors';

export function SettingsScreen() {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();
  
  const [url, setUrl] = useState(settings.n8nMcpUrl);
  const [token, setToken] = useState(settings.n8nMcpToken);
  const [cfClientId, setCfClientId] = useState(settings.cfClientId);
  const [cfClientSecret, setCfClientSecret] = useState(settings.cfClientSecret);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(settings.ttsVoiceId);
  const [workflows, setWorkflows] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(settings.selectedWorkflowId);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);

  // Load voices on mount
  useEffect(() => {
    loadVoices();
  }, []);

  // Load workflows when connection succeeds
  const loadWorkflows = async () => {
    setIsLoadingWorkflows(true);
    try {
      // Configure provider first
      n8nMcpProvider.configure({
        url,
        token,
        cfClientId,
        cfClientSecret,
      });

      const result = await n8nMcpProvider.searchWorkflows();
      if (result && result.length > 0) {
        setWorkflows(result);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  const loadVoices = async () => {
    const availableVoices = await googleTtsProvider.getVoices();
    // Filter to English voices for now
    const englishVoices = availableVoices.filter(v => 
      v.language.startsWith('en')
    );
    setVoices(englishVoices);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Configure with current form values
    n8nMcpProvider.configure({
      url,
      token,
      cfClientId,
      cfClientSecret,
    });

    const result = await n8nMcpProvider.testConnection();
    setTestResult(result);
    setIsTesting(false);

    // If connection succeeded, load workflows
    if (result.success) {
      loadWorkflows();
    }
  };

  const handleSave = async () => {
    await updateSettings({
      n8nMcpUrl: url,
      n8nMcpToken: token,
      cfClientId,
      cfClientSecret,
      selectedWorkflowId: selectedWorkflow,
      ttsVoiceId: selectedVoice,
    });

    // Update TTS voice
    if (selectedVoice) {
      googleTtsProvider.setVoice(selectedVoice);
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>Settings</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Backend Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Backend Connection</Text>
            <Text style={styles.sectionSubtitle}>
              Connect to your N8N MCP server
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MCP Server URL</Text>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://n8n.example.com/mcp-server/http"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>N8N MCP Token</Text>
              <TextInput
                style={styles.input}
                value={token}
                onChangeText={setToken}
                placeholder="Access Token from N8N Settings"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CF-Access-Client-Id (Optional)</Text>
              <TextInput
                style={styles.input}
                value={cfClientId}
                onChangeText={setCfClientId}
                placeholder="Your Cloudflare Client ID"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CF-Access-Client-Secret</Text>
              <TextInput
                style={styles.input}
                value={cfClientSecret}
                onChangeText={setCfClientSecret}
                placeholder="Your Cloudflare Client Secret"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>

            <Pressable
              style={[styles.testButton, isTesting && styles.buttonDisabled]}
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.testButtonText}>Test Connection</Text>
              )}
            </Pressable>

            {testResult && (
              <View style={[
                styles.resultBadge,
                testResult.success ? styles.resultSuccess : styles.resultError,
              ]}>
                <Text style={styles.resultText}>
                  {testResult.success ? '✓ ' : '✗ '}
                  {testResult.message}
                </Text>
              </View>
            )}
          </View>

          {/* Workflow Picker Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔄 Workflow</Text>
            <Text style={styles.sectionSubtitle}>
              Select which N8N workflow to use (Test Connection first to load)
            </Text>

            {isLoadingWorkflows ? (
              <ActivityIndicator color={colors.primary} />
            ) : workflows.length === 0 ? (
              <Text style={styles.loadingText}>
                No workflows loaded. Test connection to fetch available workflows.
              </Text>
            ) : (
              <View style={styles.voiceList}>
                {workflows.map((workflow) => (
                  <Pressable
                    key={workflow.id}
                    style={[
                      styles.voiceItem,
                      selectedWorkflow === workflow.id && styles.voiceItemSelected,
                    ]}
                    onPress={() => setSelectedWorkflow(workflow.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.voiceName,
                        selectedWorkflow === workflow.id && styles.voiceNameSelected,
                      ]}>
                        {workflow.name}
                      </Text>
                      {workflow.description && (
                        <Text style={styles.voiceLanguage}>{workflow.description}</Text>
                      )}
                    </View>
                    {selectedWorkflow === workflow.id && (
                      <Text style={{ color: colors.success }}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Voice Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔊 Text-to-Speech</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a voice for responses
            </Text>

            <View style={styles.voiceList}>
              {voices.length === 0 ? (
                <Text style={styles.loadingText}>Loading voices...</Text>
              ) : (
                voices.slice(0, 6).map((voice) => (
                  <Pressable
                    key={voice.id}
                    style={[
                      styles.voiceItem,
                      selectedVoice === voice.id && styles.voiceItemSelected,
                    ]}
                    onPress={() => setSelectedVoice(voice.id)}
                  >
                    <Text style={[
                      styles.voiceName,
                      selectedVoice === voice.id && styles.voiceNameSelected,
                    ]}>
                      {voice.name}
                    </Text>
                    <Text style={styles.voiceLanguage}>{voice.language}</Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>

          {/* Provider Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Active Providers</Text>
            
            <View style={styles.providerRow}>
              <Text style={styles.providerLabel}>Speech Recognition:</Text>
              <Text style={styles.providerValue}>Google (Native)</Text>
            </View>
            <View style={styles.providerRow}>
              <Text style={styles.providerLabel}>Text-to-Speech:</Text>
              <Text style={styles.providerValue}>Google (Native)</Text>
            </View>
            <View style={styles.providerRow}>
              <Text style={styles.providerLabel}>Backend:</Text>
              <Text style={styles.providerValue}>N8N MCP</Text>
            </View>
          </View>

          {/* Save Button */}
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
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
  backButton: {
    padding: spacing.sm,
  },
  backText: {
    color: colors.primaryLight,
    fontSize: 16,
  },
  title: {
    ...typography.h2,
  },
  placeholder: {
    width: 60,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  testButton: {
    backgroundColor: colors.backgroundTertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  resultBadge: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  resultSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: colors.success,
  },
  resultError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.error,
  },
  resultText: {
    color: colors.text,
  },
  voiceList: {
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodySecondary,
    fontStyle: 'italic',
  },
  voiceItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceItemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  voiceName: {
    ...typography.body,
  },
  voiceNameSelected: {
    color: colors.primaryLight,
    fontWeight: '600',
  },
  voiceLanguage: {
    ...typography.caption,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundTertiary,
  },
  providerLabel: {
    ...typography.bodySecondary,
  },
  providerValue: {
    ...typography.body,
    color: colors.secondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});
