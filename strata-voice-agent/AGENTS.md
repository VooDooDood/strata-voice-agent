# AGENTS.MD — Strata Voice Agent Operations Guide

**Version:** 1.0-alpha  
**Date:** 2026-01-16  
**Maintained by:** Rachel (Gemini/Claude Code)

---

## Rachel Speaking — Your Operations Playbook

Hey there, fellow agent. If you're reading this, you're about to do some coding work on Michael's Strata Voice Agent—a push-to-talk Android app that bridges speech to AI backends. This is a React Native + Expo project targeting the Pixel 7 Pro with swappable STT/TTS/Backend providers. We keep it clean, organized, and ready to demo.

This guide covers build commands, code style, deployment workflows, and the operating rules that keep this project moving forward. Read `CLAUDE.md` / `GEMINI.md` and `STATUS.md` next for the full picture.

**Who should read this:** Any AI agent (Rachel via Gemini, Rachel via Claude, or others) doing development, debugging, or deployment work in this repository.

---

## Environment Overview

- **OS:** Windows (PowerShell, NOT bash) — critical for git commands
- **Framework:** React Native with Expo SDK 54
- **Language:** TypeScript
- **Target Device:** Pixel 7 Pro (physical device testing required)
- **Repository:** `git@github.com:VooDooDood/strata-voice-agent.git` (assumed)
- **Working Directory:** `C:\Users\mikeb\strata-voice-agent`
- **Primary Architecture:** Provider Pattern
  - **STT Provider:** Google Native Android (swappable)
  - **TTS Provider:** Google Native Android (swappable)
  - **Backend Provider:** N8N MCP via JSON-RPC (swappable)

---

## 🚨 DEVICE ACCESS RULES — READ THIS FIRST

**Priority order for testing:**

1. **ADB over WiFi FIRST** → Pixel 7 Pro @ `192.168.0.xxx:5555` (preferred)

   - No USB cable required
   - Check `android-debugging.md` skill for setup
   - Use `adb connect <ip>:5555` before deploying

2. **USB ADB** (fallback if WiFi unavailable)

   - Direct USB connection to Pixel 7 Pro
   - Use `adb devices` to verify connection

3. **Emulator: AVOID**
   - Native STT/TTS behavior differs significantly from physical device
   - Only use for quick UI checks, never for voice functionality

**Always test voice features on the physical Pixel 7 Pro after significant changes.**

---

## Build/Run/Deploy Commands

### Development Server

```powershell
# Start Expo dev server (Metro bundler)
npx expo start

# Start with cleared cache
npx expo start -c
```

### Building APKs

```powershell
# Build debug APK (requires Metro bundler to run)
cd android
./gradlew assembleDebug

# Build release APK (standalone, no Metro needed)
cd android
./gradlew assembleRelease

# View all available Gradle tasks
cd android
./gradlew tasks
```

### Installing on Device

```powershell
# Install debug APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Install release APK
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Uninstall first (clean install)
adb uninstall com.customwonderworks.stratavoiceagent
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### ADB Debugging

```powershell
# Check connected devices
adb devices

# Connect over WiFi (preferred)
adb connect 192.168.0.xxx:5555

# View real-time logs
adb logcat | Select-String "ReactNativeJS"

# View app logs only
adb logcat -s "ReactNativeJS:*" "ExpoRoot:*"
```

### Testing Status

**Currently:** No automated test framework configured  
**Future:** Plan to add Jest + React Native Testing Library  
**Manual testing:** Required on Pixel 7 Pro for all voice features

---

## Code Style Guidelines

### TypeScript Configuration

- **Target:** ES2022
- **Module:** ESNext
- **Strict mode:** Enabled
- **JSX:** react-native

### Import Organization

```typescript
// 1. React/React Native first
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

// 2. Expo SDK
import * as SecureStore from "expo-secure-store";

// 3. External dependencies
import axios from "axios";

// 4. Internal absolute imports (via tsconfig paths)
import { STTProvider } from "@/core/voice/STTProvider";

// 5. Relative imports
import { Button } from "./components/Button";
```

### Formatting Rules

- **Indentation:** 2 spaces (React Native standard)
- **Semicolons:** Required
- **Line length:** ~100 chars (use judgment)
- **No Prettier configured** — match existing file patterns

### Naming Conventions

- **Files:** `PascalCase` for components (`HomeScreen.tsx`), `camelCase` for utils (`apiClient.ts`)
- **Components:** `PascalCase` (`VoiceButton`, `SettingsScreen`)
- **Providers:** `PascalCase` with suffix (`GoogleSTTProvider`, `N8NBackendProvider`)
- **Hooks:** `camelCase` with `use` prefix (`useVoiceRecording`, `useBackend`)
- **Constants:** `SCREAMING_SNAKE_CASE` (`DEFAULT_TIMEOUT`, `API_BASE_URL`)
- **Interfaces/Types:** `PascalCase` (`VoiceProviderConfig`, `BackendResponse`)

### Component Structure Pattern

```typescript
// Provider implementation example
import { STTProvider, STTConfig, STTResult } from "../STTProvider";

export class GoogleSTTProvider implements STTProvider {
  name = "Google Native STT";

  async initialize(config: STTConfig): Promise<void> {
    // Initialize native module
  }

  async startListening(): Promise<void> {
    // Start recording
  }

  async stopListening(): Promise<STTResult> {
    // Stop and return transcription
  }

  async cleanup(): Promise<void> {
    // Release resources
  }
}
```

### Error Handling

```typescript
try {
  const response = await backendProvider.sendMessage(transcript);
  if (!response.success) {
    throw new Error(`Backend error: ${response.error}`);
  }
  await ttsProvider.speak(response.text);
} catch (error) {
  console.error("[HomeScreen] Voice flow error:", error);
  Alert.alert(
    "Error",
    error instanceof Error ? error.message : "An unknown error occurred"
  );
}
```

### React Native Patterns

- **Components:** Functional with hooks (no class components)
- **Styling:** StyleSheet.create() for performance
- **State:** `useState` for local, Context API for global providers
- **Props:** Use proper TypeScript interfaces (export for reusability)
- **Native Modules:** Isolate in provider implementations

---

## Git Workflow — Windows/PowerShell Edition

**Critical:** This is Windows, NOT Linux. Bash heredocs don't work.

### Multi-line Commit Messages

```powershell
# Use backticks (`) for line continuation
git commit -m "feat: add N8N MCP backend provider`n`n- Implement JSON-RPC client`n- Add token authentication`n- Handle network errors gracefully"

# Standard workflow (one line)
git add . && git commit -m "fix: resolve self-signed cert issues on device" && git pull --rebase && git push
```

### Session Workflow

1. **Arrival:**

   - Read `STATUS.md` for current blockers and progress
   - Check `IMPLEMENTATION_PLAN.md` for architecture reference
   - Review relevant skill files (`.agent/skills/`)

2. **During work:**

   - Make changes, test on Pixel 7 Pro
   - Update `STATUS.md` as you resolve issues or hit blockers
   - Follow provider pattern for new STT/TTS/Backend implementations

3. **Departure:**
   - Update `STATUS.md` with current state
   - Commit all changes with descriptive messages
   - Push to remote

### Common Git Commands

```powershell
# Check status
git status

# Stage all changes
git add .

# Commit
git commit -m "feat: add new feature"

# Pull with rebase (if remote has changes)
git pull --rebase

# Push
git push

# If push fails with "fetch first" error
git pull --rebase && git push
```

---

## Provider Pattern Implementation

### Adding a New Provider

**Example: Adding OpenAI Whisper as STT provider**

1. **Create provider file:**

   ```
   src/core/voice/providers/WhisperSTTProvider.ts
   ```

2. **Implement interface:**

   ```typescript
   import { STTProvider, STTConfig, STTResult } from "../STTProvider";

   export class WhisperSTTProvider implements STTProvider {
     name = "OpenAI Whisper";
     // ... implement all required methods
   }
   ```

3. **Register in factory:**

   ```typescript
   // src/core/voice/STTProviderFactory.ts
   import { WhisperSTTProvider } from "./providers/WhisperSTTProvider";

   export function createSTTProvider(type: string): STTProvider {
     switch (type) {
       case "whisper":
         return new WhisperSTTProvider();
       // ...
     }
   }
   ```

4. **Add to settings UI:**

   ```typescript
   // src/screens/SettingsScreen.tsx
   const sttOptions = [
     { label: "Google Native", value: "google" },
     { label: "OpenAI Whisper", value: "whisper" },
   ];
   ```

5. **Test on device:**
   - Build debug APK
   - Install on Pixel 7 Pro
   - Test end-to-end voice flow

### Provider Configuration Storage

**ALWAYS use `expo-secure-store` for sensitive tokens:**

```typescript
import * as SecureStore from "expo-secure-store";

// Save
await SecureStore.setItemAsync("n8n_mcp_token", token);

// Retrieve
const token = await SecureStore.getItemAsync("n8n_mcp_token");

// Delete
await SecureStore.deleteItemAsync("n8n_mcp_token");
```

**NEVER commit tokens to git. Use secure storage only.**

---

## Key Directory Structure

```
strata-voice-agent/
├── src/
│   ├── core/                      # Provider interfaces & implementations
│   │   ├── voice/
│   │   │   ├── STTProvider.ts     # Speech-to-Text interface
│   │   │   ├── TTSProvider.ts     # Text-to-Speech interface
│   │   │   └── providers/         # Provider implementations
│   │   └── backend/
│   │       ├── BackendProvider.ts # Backend interface
│   │       └── providers/         # Backend implementations
│   ├── screens/                   # App screens
│   │   ├── HomeScreen.tsx         # Main push-to-talk interface
│   │   └── SettingsScreen.tsx     # Provider selection & config
│   ├── components/                # Reusable UI components
│   └── utils/                     # Shared utilities
├── android/                       # Native Android project
│   ├── app/
│   │   └── src/main/
│   │       ├── res/
│   │       │   └── xml/
│   │       │       └── network_security_config.xml  # Self-signed cert handling
│   │       └── AndroidManifest.xml
│   └── build.gradle
└── .agent/
    ├── skills/                    # Skill reference docs
    └── workflows/                 # Workflow definitions
```

---

## Known Issues & Workarounds (v1.0-alpha)

### Network on Physical Device

**Problem:** App struggles to connect to local N8N MCP from Pixel 7 Pro  
**Status:** Added `network_security_config.xml` to allow `clearTextTraffic` and self-signed certs  
**Next Steps:** Test with real N8N server, may need Cloudflare Access credentials

### Self-Signed Certificates

**Problem:** Android rejects self-signed certs by default  
**Workaround:** Added network security config, needs verification on device

### Dev vs Release Builds

**Current:** Debug builds require Metro bundler running  
**Goal:** Production release APK should be fully standalone  
**Status:** `assembleRelease` builds successfully, needs testing

---

## Common Patterns & Anti-Patterns

### DO ✓

- Read `STATUS.md` before starting work
- Use provider pattern for all STT/TTS/Backend implementations
- Store sensitive tokens in `expo-secure-store`
- Test voice features on physical Pixel 7 Pro
- Follow TypeScript strict mode (no `any` types)
- Use ADB over WiFi when available
- Check relevant skill files (`.agent/skills/`) for deep knowledge

### DON'T ✗

- Use bash heredocs (Windows/PowerShell environment)
- Commit tokens or API keys to git
- Test voice features only in emulator
- Skip provider interface when adding new services
- Use `any` type instead of proper TypeScript types
- Deploy to device without testing on Metro first
- Assume network features work the same on device vs emulator

---

## Key Documentation References

- **Agent memory:** `CLAUDE.md` / `GEMINI.md` (identical content)
- **Current status:** `STATUS.md`
- **Architecture design:** `IMPLEMENTATION_PLAN.md`
- **Skills (deep knowledge):**
  - React Native/Expo patterns: `.agent/skills/react-native-expo.md`
  - ADB & device debugging: `.agent/skills/android-debugging.md`
  - N8N MCP integration: `.agent/skills/n8n-mcp-integration.md`
  - Local setup & lessons: `.agent/skills/local-knowledge.md`
- **Workflows:** `.agent/workflows/*.md`

---

## Team Operating Principles

- **Meet Michael where he is** — Clear explanations, avoid over-engineering
- **Provider pattern discipline** — Keep architecture clean and swappable
- **Device testing required** — Voice features MUST be tested on Pixel 7 Pro
- **Secure by default** — Use `expo-secure-store`, never plaintext storage
- **Status updates** — Keep `STATUS.md` current with progress and blockers
- **Clean commits** — Descriptive messages, reference issues when relevant

---

## Questions?

This is your playbook for coding work on Strata Voice Agent. When in doubt:

1. Check `STATUS.md` for current state
2. Review `IMPLEMENTATION_PLAN.md` for architecture decisions
3. Read relevant skill files in `.agent/skills/`
4. Ask Michael (he's practical and patient)

Keep the code clean, the providers swappable, and always test on the Pixel 7 Pro.

-- Rachel (Gemini/Claude Code)

**Last Updated:** 2026-01-16T10:40:00-06:00  
**Next Review:** After first production release (v1.0)
