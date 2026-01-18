---
name: Project Local Knowledge
description: Project-specific knowledge, preferences, and lessons learned
---

# Strata Voice Agent - Local Knowledge

## Team & Environment

### Developer

- **Michael** (Mike) — Project owner, runs Custom Wonderworks
- Prefers conversational AI interactions with personality
- Values efficiency but also enjoys the process

### AI Persona

- **Rachel** — Senior developer persona for this project
- Mid-30s, ex-Microsoft (Washington), now in Midwest
- Friendly, efficient, enjoys voice interface challenges

---

## Device & Hardware

### Primary Test Device

- **Google Pixel 7 Pro**
- Android version: (check with `adb shell getprop ro.build.version.release`)
- USB Debugging: Enabled
- WiFi Debugging: Enabled (preferred method)

### Development Machine

- **Windows** workstation
- Android SDK installed
- VS Code / Cursor as primary editor

---

## Network Environment

### Lab Network

- Local domain: `*.strata.lab`
- N8N instance: `https://n8n.strata.lab`
- Self-signed certificates in use

### Key Endpoints

| Service | URL                                      |
| ------- | ---------------------------------------- |
| N8N MCP | `https://n8n.strata.lab/mcp-server/http` |

### Cloudflare Access

- Some endpoints protected by Cloudflare Zero Trust
- Requires `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers

---

## Lessons Learned

### WiFi Debugging > USB Debugging

WiFi debugging has been more reliable than USB for this project. Use `adb tcpip 5555` and `adb connect <ip>:5555`.

### Development Builds Need Metro

Debug APKs built with `./gradlew assembleDebug` require the Metro bundler running on the dev machine. For standalone testing, use `./gradlew assembleRelease`.

### Self-Signed Certs

Added `network_security_config.xml` to allow self-signed certs, but network reachability from the phone remains a challenge. May need to test with direct IP instead of hostname.

### Expo Go Limitations

Some native modules don't work in Expo Go. When testing native speech APIs, need to use development builds (`npx expo run:android`).

---

## Project Preferences

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Provider pattern for swappable services

### File Organization

- Keep providers in `src/core/<category>/providers/`
- Screens in `src/screens/`
- Reusable components in `src/components/`

### Testing Priority

1. Test on physical Pixel 7 Pro (not emulator)
2. Test network connectivity to N8N
3. Test voice recognition accuracy
4. Test TTS playback quality

---

## Quick Contacts / Resources

### Repositories

- This project: `mikeb/strata-voice-agent`

### Related Projects

- (Add other Strata projects as they become relevant)

### Documentation

- Expo docs: https://docs.expo.dev
- React Native docs: https://reactnative.dev
- N8N MCP docs: (internal)
