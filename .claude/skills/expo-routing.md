---
name: expo-routing
description: Use when creating new screens, adding navigation routes, implementing deep links, or modifying tab/stack navigation in the BookIt app. Triggers on any file under app/ directory.
---

# Expo Router Navigation Patterns

## Overview
BookIt uses Expo Router v57 with file-based routing. Every file under `app/` becomes a route. Follow these patterns exactly.

## Architecture

```
app/
  _layout.tsx          # Root Stack navigator
  (tabs)/
    _layout.tsx        # Tab navigator (Explore, Profile)
    index.tsx          # Home/Explore tab
    profile.tsx        # Profile tab
  salon/
    [id].tsx           # Dynamic salon detail
```

## Rules

1. **Always read Expo v57 docs** before adding routes: https://docs.expo.dev/versions/v57.0.0/
2. **New tabs** go in `app/(tabs)/` with matching icon in `(tabs)/_layout.tsx`
3. **Detail screens** use dynamic routes: `app/entity/[id].tsx`
4. **Modal screens** use route groups: `app/(modals)/screen.tsx`
5. **Navigation** uses `useRouter()` from `expo-router`, never React Navigation directly
6. **All screens** must use `SafeAreaView` or `useSafeAreaInsets()`
7. **Headers** are hidden at root Stack level; screens manage their own header UI
8. **Back navigation** uses `router.back()` with a touchable back button in the hero/header area

## Adding a New Screen

```typescript
// 1. Create file: app/entity/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EntityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // ...
}

// 2. Register in app/_layout.tsx Stack
<Stack.Screen name="entity/[id]" />

// 3. Navigate from another screen
router.push(`/entity/${item.id}`);
```

## Adding a New Tab

```typescript
// In app/(tabs)/_layout.tsx, add to Tabs:
<Tabs.Screen
  name="newtab"
  options={{
    title: 'New Tab',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="icon-name" size={size} color={color} />
    ),
  }}
/>
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Importing from `@react-navigation/native` | Use `expo-router` exports instead |
| Forgetting to register route in `_layout.tsx` | Every new route directory needs a `Stack.Screen` entry |
| Using `navigation.navigate()` | Use `router.push()` / `router.replace()` |
| Hardcoding safe area padding | Use `useSafeAreaInsets()` hook |
