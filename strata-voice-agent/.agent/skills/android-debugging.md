---
name: Android Debugging
description: Android debugging techniques with focus on WiFi debugging (preferred over USB)
---

# Android Debugging

## WiFi Debugging (Preferred Method)

WiFi debugging has proven more reliable than USB for this project. Here's how to set it up:

### Initial Setup (One-time)

1. Connect device via USB first
2. Enable wireless debugging:
   ```bash
   adb tcpip 5555
   ```
3. Find device IP (Settings → About Phone → IP Address)
4. Connect:
   ```bash
   adb connect <device-ip>:5555
   ```
5. Unplug USB cable

### Reconnecting

```bash
# If connection drops, just reconnect
adb connect <device-ip>:5555

# Check connection status
adb devices
```

### Pixel 7 Pro Specific

- IP typically on 192.168.x.x network
- Wireless debugging stays active across reboots if enabled in Developer Options
- Settings → Developer Options → Wireless debugging → ON

---

## ADB Quick Reference

### Device Management

```bash
# List connected devices
adb devices

# Restart ADB server (fixes many issues)
adb kill-server && adb start-server

# Get device shell
adb shell
```

### App Installation

```bash
# Install APK
adb install app.apk

# Reinstall (keep data)
adb install -r app.apk

# Uninstall
adb uninstall com.strata.voiceagent
```

### Logs

```bash
# View all logs (verbose)
adb logcat

# Filter by tag
adb logcat -s ReactNativeJS

# Filter by app package
adb logcat --pid=$(adb shell pidof com.strata.voiceagent)

# Clear logs
adb logcat -c
```

### Network Debugging

```bash
# Test if device can reach an endpoint
adb shell curl -I https://n8n.strata.lab

# Check DNS resolution
adb shell nslookup n8n.strata.lab

# View network config
adb shell ip addr
```

---

## Gradle Commands

Run from `android/` directory:

```bash
# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install debug directly
./gradlew installDebug

# List all tasks
./gradlew tasks
```

### Output Locations

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## Common Issues

| Issue                                | Solution                                            |
| ------------------------------------ | --------------------------------------------------- |
| "device unauthorized"                | Re-authorize on device, check USB debugging enabled |
| WiFi debug disconnects               | Device went to sleep—reconnect with `adb connect`   |
| Build fails with NDK error           | Check `local.properties` has correct SDK path       |
| "INSTALL_FAILED_UPDATE_INCOMPATIBLE" | Uninstall existing app first                        |
| Can't find device on WiFi            | Same network? Firewall blocking port 5555?          |
