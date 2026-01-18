# Project Status: Strata Voice Agent (v1.0-alpha)

**Last Updated:** 2026-01-15

## Overview

This is a modular React Native (Expo) application designed to be a "Push-to-Talk" interface for AI backends.
The core architecture is implemented using a **Provider Pattern** for:

- **STT (Speech-to-Text):** Currently implements Google Native Android STT.
- **TTS (Text-to-Speech):** Currently implements Google Native Android TTS.
- **Backend:** Currently implements an N8N MCP client (JSON-RPC over HTTP).

## Current State

### ✅ What Works

- **UI/UX:** Dark mode interface with animated PTT button and message history is fully built.
- **Architecture:** The provider system (`src/core`) is solid. You can swap providers without touching UI code.
- **Android Build:** The project successfully builds into an APK using `npx expo run:android` (requires Android Studio).
- **Google Native Integration:** The app successfully requests permissions and accesses native Android speech APIs.
- **Configuration:** Settings screen allows dynamic configuration of URLs and Tokens.

### ⚠️ Known Issues / Blockers

- **Network Connectivity on Physical Device:**
  - The app installs on a physical Pixel 7 Pro but struggles to connect to the local N8N instance (`https://n8n.lab` or IP).
  - **Self-Signed Certs:** We added a `network_security_config.xml` to allow self-signed certs, but verification failed due to network reachability or Metro bundler reliance.
  - **Metro Bundler:** The current builds were "Development Builds" which require a connection to the Metro server (PC). A "Release Build" (standalone APK) was planned but not completed.

### 🏠 Architecture

- **State Management:** `SettingsContext` persists user config (using `expo-secure-store` for tokens).
- **Backend Protocol:** Sends JSON-RPC 2.0 requests to N8N. Supports both Cloudflare Access headers (`CF-Access-Client-Id`) and direct Bearer tokens.

## Next Steps for Future Developer

1. **Build Release APK:** Run `./gradlew assembleRelease` in the `android` folder to create a standalone APK that doesn't need the development server.
2. **Network Debugging:** Verify the phone can reach the N8N instance IP. The code is ready for both direct IP and hostname modules.
3. **Cloudflare Integration:** The fields are in the Settings UI, but temporarily deprioritized for direct local IP testing.
