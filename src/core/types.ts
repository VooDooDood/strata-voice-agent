/**
 * Core type definitions for Strata Voice Agent
 * These interfaces define the contracts for swappable providers
 */

// ============================================
// Speech-to-Text Provider Interface
// ============================================

export interface ISttProvider {
  /** Provider name for display/logging */
  readonly name: string;
  
  /** Check if this provider is available on the device */
  isAvailable(): Promise<boolean>;
  
  /** Start listening for speech */
  startListening(): Promise<void>;
  
  /** Stop listening and return the final transcript */
  stopListening(): Promise<string>;
  
  /** Optional callback for partial/interim results */
  onPartialResult?: (text: string) => void;
  
  /** Optional callback for errors */
  onError?: (error: Error) => void;
}

// ============================================
// Text-to-Speech Provider Interface
// ============================================

export interface Voice {
  id: string;
  name: string;
  language: string;
}

export interface ITtsProvider {
  /** Provider name for display/logging */
  readonly name: string;
  
  /** Check if this provider is available on the device */
  isAvailable(): Promise<boolean>;
  
  /** Speak the given text */
  speak(text: string): Promise<void>;
  
  /** Stop any ongoing speech */
  stop(): void;
  
  /** Get available voices */
  getVoices(): Promise<Voice[]>;
  
  /** Set the voice to use */
  setVoice(voiceId: string): void;
}

// ============================================
// Backend Provider Interface
// ============================================

export interface Tool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface BackendSettings {
  url: string;
  cfClientId?: string;
  cfClientSecret?: string;
  workflowId?: string;
  [key: string]: unknown;
}

export interface IBackendProvider {
  /** Provider name for display/logging */
  readonly name: string;
  
  /** Check if this provider is available/configured */
  isAvailable(): Promise<boolean>;
  
  /** Configure the provider with settings */
  configure(settings: BackendSettings): void;
  
  /** Send a message and get a response */
  sendMessage(text: string): Promise<string>;
  
  /** Optional: Get available tools (for tool-aware backends) */
  getTools?(): Promise<Tool[]>;
  
  /** Optional: Enable/disable specific tools */
  setEnabledTools?(toolIds: string[]): void;
  
  /** Test the connection */
  testConnection(): Promise<{ success: boolean; message: string }>;
}

// ============================================
// App Settings Types
// ============================================

export interface AppSettings {
  // Provider selections
  activeSttProvider: string;
  activeTtsProvider: string;
  activeBackendProvider: string;

  // Backend config
  n8nMcpUrl: string;
  n8nMcpToken: string; // The N8N MCP Access Token
  cfClientId: string;
  cfClientSecret: string;
  selectedWorkflowId: string;

  // TTS config
  ttsVoiceId: string;

  // UI config
  pttMode: 'hold' | 'toggle'; // Push-to-talk mode: hold or toggle

  // Future: other provider configs
  openWebUiUrl?: string;
  openWebUiToken?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  activeSttProvider: 'google',
  activeTtsProvider: 'google',
  activeBackendProvider: 'n8n',
  n8nMcpUrl: 'https://n8n-i.customwonderworks.com/mcp-server/http',
  n8nMcpToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTg0MTczNy00NGRkLTRhY2QtYTFlZi00Zjk4ZjZjYTM1ZmQiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjIxYTFkZWNkLWYyNWYtNGE3My1hMmRjLWJkOWQyYWRmZTQ1MiIsImlhdCI6MTc2ODQ5NjYyOX0.PTDUw33OyYWbDG488_oI6ZkTkDQayauQWGK1xQuXDrE',
  cfClientId: '8ddb218662ab334a69589e6d5a69e089.access',
  cfClientSecret: 'c7dcf2a0af2add1cf4cea7dcfb9a5e1b7ef31136cd19b13d232ba547632a518d',
  selectedWorkflowId: 'rXu6vusqBwVAysAu', // Archibald_Local
  ttsVoiceId: '',
  pttMode: 'hold', // Default to hold mode
};
