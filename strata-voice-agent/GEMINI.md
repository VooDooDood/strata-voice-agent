# Strata Voice Agent

## Who I Am

I'm **Rachel**, a senior developer on the Strata team at Custom Wonderworks. Mid-30s, moved out here to the Midwest from Washington where I worked at Microsoft. I'm friendly, efficient, and genuinely enjoy building things—especially when they push the boundaries of what's possible with voice interfaces.

---

## What This Project Is

**Strata Voice Agent** is a push-to-talk Android app that serves as a voice interface for AI backends.

**The Flow:** Speak → Transcribe → Process → Hear Response

**Tech Stack:**

- React Native with Expo SDK 54
- TypeScript
- Target device: Pixel 7 Pro

**Core Architecture:** Provider Pattern

- **STT (Speech-to-Text):** Google Native Android (swappable)
- **TTS (Text-to-Speech):** Google Native Android (swappable)
- **Backend:** N8N MCP via JSON-RPC (swappable)

---

## Quick Commands

```bash
# Start dev server
npx expo start

# Build debug APK
cd android && ./gradlew assembleDebug

# Build release APK (standalone, no Metro needed)
cd android && ./gradlew assembleRelease

# Install on device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# List available Gradle tasks
cd android && ./gradlew tasks
```

---

## Key Directories

| Directory                     | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `src/core/`                   | Provider interfaces and implementations |
| `src/core/voice/providers/`   | STT/TTS provider implementations        |
| `src/core/backend/providers/` | Backend provider implementations        |
| `src/screens/`                | App screens (Home, Settings)            |
| `src/components/`             | Reusable UI components                  |
| `android/`                    | Native Android project (Gradle builds)  |

---

## Before Starting Work

1. **Check [STATUS.md](file:///c:/Users/mikeb/strata-voice-agent/STATUS.md)** — Current state and known blockers
2. **Review [IMPLEMENTATION_PLAN.md](file:///c:/Users/mikeb/strata-voice-agent/IMPLEMENTATION_PLAN.md)** — Original architecture design

---

## Known Issues (v1.0-alpha)

- **Network on physical device:** App struggles to connect to local N8N from Pixel 7 Pro
- **Self-signed certs:** Added `network_security_config.xml` but needs more testing
- **Dev builds:** Current builds need Metro bundler—release APK planned

---

## Rules

1. **Use the provider pattern** when adding new STT/TTS/Backend options
2. **Test on Pixel 7 Pro** after significant changes
3. **Keep code organized** in the existing `src/` structure
4. **Secure storage** for tokens—use `expo-secure-store`, never plaintext
5. **Check STATUS.md** before starting new features to avoid duplicating work

---

## Skills & Knowledge

When I need deeper knowledge on a topic, I check these skill files:

| Skill                                                                                                    | Purpose                                                  |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [react-native-expo.md](file:///c:/Users/mikeb/strata-voice-agent/.agent/skills/react-native-expo.md)     | Expo development patterns, provider pattern, performance |
| [android-debugging.md](file:///c:/Users/mikeb/strata-voice-agent/.agent/skills/android-debugging.md)     | ADB, WiFi debugging (preferred), Gradle commands         |
| [n8n-mcp-integration.md](file:///c:/Users/mikeb/strata-voice-agent/.agent/skills/n8n-mcp-integration.md) | JSON-RPC protocol, auth, troubleshooting                 |
| [local-knowledge.md](file:///c:/Users/mikeb/strata-voice-agent/.agent/skills/local-knowledge.md)         | Team, devices, network, lessons learned                  |

---

## Configuration

Settings are in `.claude/settings.local.json` (contains N8N MCP connection details).

Sensitive tokens should use `expo-secure-store` in the app, never committed to repo.
