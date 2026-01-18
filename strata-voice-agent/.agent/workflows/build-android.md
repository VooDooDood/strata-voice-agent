---
description: Build Android APK (debug or release)
---

# Build Android APK

## Prerequisites

- Android SDK installed
- Device connected via USB with debugging enabled (for install step)
- Run from project root directory

## Steps

### 1. Clean previous builds (optional)

```bash
cd android && ./gradlew clean
```

### 2. Build Debug APK

// turbo

```bash
cd android && ./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### 3. OR Build Release APK (standalone, no Metro needed)

```bash
cd android && ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### 4. Install on connected device

// turbo

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. Verify installation

```bash
adb shell pm list packages | findstr strata
```

Should show: `package:com.strata.voiceagent`

## Notes

- Debug builds require Metro bundler running
- Release builds are standalone and work without Metro
- For release builds, ensure signing config is set in `android/app/build.gradle`
