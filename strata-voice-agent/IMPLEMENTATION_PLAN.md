# Strata Voice Agent - Implementation Plan

A push-to-talk mobile voice interface for your AI backends. Speak → Transcribe → Process → Hear Response.

## User Review Required

> [!IMPORTANT] > **GitHub Repo**: I'll create `mikeb/strata-voice-agent` on GitHub after you approve this plan.

> [!NOTE] > **v1.0 Scope**: Google STT/TTS (native Android), N8N MCP backend. All provider interfaces built for future expansion.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    STRATA VOICE AGENT                       │
├─────────────────────────────────────────────────────────────┤
│  📱 React Native (Expo SDK 54)                              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PROVIDER LAYER (Swappable)                           │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │  │
│  │  │ STT Provider│  │ TTS Provider│  │Backend Provider│  │  │
│  │  │ ─────────── │  │ ─────────── │  │ ────────────── │  │  │
│  │  │ • Google ✓  │  │ • Google ✓  │  │ • N8N MCP ✓    │  │  │
│  │  │ • Whisper   │  │ • Piper     │  │ • OpenWebUI    │  │  │
│  │  │ • Deepgram  │  │ • ElevenLabs│  │ • Direct LLM   │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  CORE LAYER                                           │  │
│  │  • VoiceEngine (orchestrates STT/TTS providers)       │  │
│  │  • BackendManager (orchestrates backend providers)    │  │
│  │  • SettingsManager (persists user config)             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  UI LAYER                                             │  │
│  │  • VoiceChatScreen (main PTT interface)               │  │
│  │  • SettingsScreen (provider config, connection test)  │  │
│  │  • [Future: ToolPickerScreen, HistoryScreen]          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Provider Pattern (The Extensibility Core)

Every major subsystem uses interfaces so implementations can be swapped:

```typescript
// STT Provider Interface
interface ISttProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  startListening(): Promise<void>;
  stopListening(): Promise<string>; // returns transcript
  onPartialResult?: (text: string) => void;
}

// TTS Provider Interface
interface ITtsProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  speak(text: string): Promise<void>;
  stop(): void;
  getVoices(): Promise<Voice[]>;
  setVoice(voiceId: string): void;
}

// Backend Provider Interface
interface IBackendProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  configure(settings: BackendSettings): void;
  sendMessage(text: string): Promise<string>; // returns response
  getTools?(): Promise<Tool[]>; // optional, for tool-aware backends
  setEnabledTools?(toolIds: string[]): void; // optional
}
```

### 2. v1.0 Providers (What We Build Now)

| Layer   | Provider            | Implementation                                               |
| :------ | :------------------ | :----------------------------------------------------------- |
| STT     | `GoogleSttProvider` | Uses `expo-speech-recognition` → Android's native Google STT |
| TTS     | `GoogleTtsProvider` | Uses `expo-speech` → Android's native Google TTS             |
| Backend | `N8nMcpProvider`    | JSON-RPC over HTTPS to N8N MCP server                        |

### 3. Settings Storage

| Setting                 | Storage      | Default                                  |
| :---------------------- | :----------- | :--------------------------------------- |
| Active STT Provider     | AsyncStorage | `google`                                 |
| Active TTS Provider     | AsyncStorage | `google`                                 |
| Active Backend Provider | AsyncStorage | `n8n`                                    |
| N8N MCP URL             | AsyncStorage | `https://n8n.strata.lab/mcp-server/http` |
| MCP Token               | SecureStore  | _(user enters)_                          |
| Selected Workflow       | AsyncStorage | _(auto-discover)_                        |
| TTS Voice ID            | AsyncStorage | System default                           |

### 4. Keyboard-Aware UI

- PTT button placed center-screen (not bottom)
- All screens use `KeyboardAvoidingView`
- Settings form scrolls above keyboard

---

## Proposed Changes

### Repository Structure

```
strata-voice-agent/
├── app.json                          # Expo config
├── App.tsx                           # Entry point + navigation
├── src/
│   ├── core/
│   │   ├── types.ts                  # All interfaces (ISttProvider, etc.)
│   │   ├── voice/
│   │   │   ├── VoiceEngine.ts        # Orchestrator for STT/TTS
│   │   │   └── providers/
│   │   │       ├── GoogleSttProvider.ts   # v1.0 ✓
│   │   │       └── GoogleTtsProvider.ts   # v1.0 ✓
│   │   ├── backend/
│   │   │   ├── BackendManager.ts     # Orchestrator for backends
│   │   │   └── providers/
│   │   │       └── N8nMcpProvider.ts      # v1.0 ✓
│   │   └── settings/
│   │       └── SettingsContext.tsx   # React context for config
│   ├── screens/
│   │   ├── HomeScreen.tsx            # Main PTT interface
│   │   └── SettingsScreen.tsx        # Provider config
│   ├── components/
│   │   ├── PushToTalkButton.tsx      # Animated PTT button
│   │   ├── TranscriptBubble.tsx      # Shows user speech
│   │   └── ResponseBubble.tsx        # Shows AI response
│   └── theme/
│       └── colors.ts                 # Dark theme tokens
├── assets/
│   ├── icon.png
│   └── splash.png
└── README.md
```

---

### Component Details

#### [NEW] `src/core/types.ts`

Central type definitions for all provider interfaces. This is the contract that makes extensibility work.

#### [NEW] `src/core/voice/VoiceEngine.ts`

- Holds references to active STT and TTS providers
- Exposes `startListening()`, `stopListening()`, `speak()`
- Swaps providers based on settings

#### [NEW] `src/core/voice/providers/GoogleSttProvider.ts`

- Wraps `expo-speech-recognition`
- Implements `ISttProvider`
- Uses Android's native Google speech recognition

#### [NEW] `src/core/voice/providers/GoogleTtsProvider.ts`

- Wraps `expo-speech`
- Implements `ITtsProvider`
- Uses Android's native Google TTS

#### [NEW] `src/core/backend/BackendManager.ts`

- Holds reference to active backend provider
- Exposes `sendMessage()`
- Swaps providers based on settings

#### [NEW] `src/core/backend/providers/N8nMcpProvider.ts`

- JSON-RPC client for N8N MCP server
- Implements `IBackendProvider`
- Handles auth via Cloudflare Access token

#### [NEW] `src/screens/HomeScreen.tsx`

- Large PTT button (center screen)
- Pulsing animation while recording
- Shows transcript as you speak
- Shows response with auto-TTS playback

#### [NEW] `src/screens/SettingsScreen.tsx`

- Backend URL and token fields
- Test Connection button
- Workflow picker (populated from MCP)
- TTS voice selector

---

## Future Extensibility (Not in v1.0)

The architecture supports adding these later with minimal changes:

| Feature              | How to Add                                                     |
| :------------------- | :------------------------------------------------------------- |
| Whisper local STT    | Add `WhisperSttProvider.ts`, list in settings                  |
| OpenWebUI backend    | Add `OpenWebUIProvider.ts`, list in settings                   |
| Tool picker UI       | Add `ToolPickerScreen.tsx`, only shown for tool-aware backends |
| Local LLM router     | Add `LocalAgentProvider.ts` in backend layer                   |
| Conversation history | Add SQLite storage, `HistoryScreen.tsx`                        |

---

## Dependencies

```json
{
  "expo": "~54.0.0",
  "expo-speech": "~13.0.0",
  "expo-speech-recognition": "~0.3.0",
  "expo-secure-store": "~14.0.0",
  "@react-native-async-storage/async-storage": "2.1.0",
  "react-native-safe-area-context": "4.14.0",
  "@react-navigation/native": "^7.0.0",
  "@react-navigation/stack": "^7.0.0",
  "react-native-gesture-handler": "~2.20.0",
  "react-native-reanimated": "~3.16.0"
}
```

---

## Verification Plan

### Automated (Expo Development)

```bash
# Start dev server
npx expo start

# Run on connected Pixel 7 Pro via Expo Go
# Press 'a' for Android in terminal
```

### Manual Testing Checklist

1. **STT Test**

   - Hold PTT button → speak → release
   - Verify transcript appears on screen
   - Verify Google's STT is being used (check for Google mic animation)

2. **TTS Test**

   - Receive a response → verify auto-playback
   - Tap response bubble → verify replay works

3. **Backend Test**

   - Enter N8N MCP URL and token in settings
   - Tap "Test Connection" → verify success
   - Send voice message → verify N8N receives and responds

4. **Build APK Test**
   ```bash
   eas build -p android --profile preview
   ```
   - Install APK on Pixel 7 Pro
   - Verify all features work outside Expo Go

---

## Next Steps (After Approval)

1. ✅ Create GitHub repo `strata-voice-agent`
2. Scaffold Expo project with `npx create-expo-app@latest ./`
3. Install dependencies
4. Implement core interfaces (`types.ts`)
5. Build v1.0 providers (Google STT/TTS, N8N MCP)
6. Create screens
7. Test on Pixel 7 Pro
8. Build APK
