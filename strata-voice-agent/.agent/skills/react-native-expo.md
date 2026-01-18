---
name: React Native Expo Development
description: Core development patterns and best practices for React Native with Expo
---

# React Native Expo Development

## Expo SDK 54 Quick Reference

### Starting Development

```bash
# Start Metro bundler
npx expo start

# Start with tunnel (useful for testing on physical device)
npx expo start --tunnel

# Clear cache and start fresh
npx expo start --clear
```

### Package Management

```bash
# Always use expo install for dependencies (ensures compatibility)
npx expo install <package-name>

# Check for outdated packages
npx expo install --check

# Fix version mismatches
npx expo install --fix
```

---

## Provider Pattern Implementation

This project uses a provider pattern for swappable services. When adding a new provider:

### 1. Define the Interface (if new type)

Location: `src/core/types.ts`

```typescript
interface INewProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  // ... other methods
}
```

### 2. Implement the Provider

Location: `src/core/<category>/providers/NewProvider.ts`

```typescript
export class NewProvider implements INewProvider {
  readonly name = "new-provider";

  async isAvailable(): Promise<boolean> {
    // Check if this provider can be used
  }
}
```

### 3. Register in Manager

Add to the appropriate manager (`VoiceEngine.ts` or `BackendManager.ts`).

---

## Performance Best Practices

### Lists

- Use `FlatList` or `SectionList` for long lists (not `ScrollView` with `.map()`)
- Set `initialNumToRender` and `windowSize` for large lists
- Use `keyExtractor` with stable IDs

### Images

- Use WebP format when possible
- Implement lazy loading for images
- Cache frequently used images

### Animations

- Use `react-native-reanimated` for smooth animations
- Enable `useNativeDriver: true` when possible
- Worklets run on UI thread—use for gesture-driven animations

### Re-renders

- Use `React.memo()` for components that don't need frequent updates
- Use `useCallback` and `useMemo` for expensive computations
- Profile with React DevTools Profiler

---

## Secure Storage

### Tokens and Sensitive Data

```typescript
import * as SecureStore from "expo-secure-store";

// Save
await SecureStore.setItemAsync("token", value);

// Retrieve
const token = await SecureStore.getItemAsync("token");

// Delete
await SecureStore.deleteItemAsync("token");
```

**Never use AsyncStorage for sensitive data—it's not encrypted!**

---

## Common Issues

| Issue                      | Solution                                 |
| -------------------------- | ---------------------------------------- |
| "Unable to resolve module" | Run `npx expo start --clear`             |
| Metro bundler crash        | Delete `node_modules/.cache` and restart |
| Expo Go can't connect      | Use `--tunnel` mode or check firewall    |
| Native module error        | Need to rebuild with `npx expo prebuild` |
