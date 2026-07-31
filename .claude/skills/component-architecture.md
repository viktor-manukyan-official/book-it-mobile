---
name: component-architecture
description: Use when creating UI components, refactoring screens into reusable parts, or deciding where to place shared vs screen-specific code in the BookIt mobile app.
---

# Component Architecture

## Overview
BookIt follows a clear separation: route screens in `app/`, reusable components in `src/components/`, domain logic in `src/hooks/` and `src/services/`.

## Directory Ownership

| Directory | Purpose | Rule |
|-----------|---------|------|
| `app/` | Route screens only | No reusable components here |
| `src/components/` | Shared UI components | Must be used by 2+ screens, or extracted for testability |
| `src/hooks/` | Custom React hooks | Business logic, data fetching, state management |
| `src/services/` | API clients, external integrations | No React dependencies |
| `src/types/` | Shared TypeScript interfaces | No runtime code |
| `src/screens/` | Complex screen logic (if needed) | Only when screen file exceeds ~300 lines |
| `constants/` | App-wide constants (colors, config) | No functions, no logic |
| `data/` | Mock data, seed data | Will be replaced by real API calls |

## Component Pattern

```typescript
// src/components/SalonCard.tsx
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import type { Salon } from '@/data/mock';

interface SalonCardProps {
  salon: Salon;
  onPress: (id: string) => void;
}

export function SalonCard({ salon, onPress }: SalonCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(salon.id)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${salon.name}, rated ${salon.rating}`}
    >
      {/* ... */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    // ...
  },
});
```

## Rules

1. **Props over context** for component data - pass explicitly unless deeply nested
2. **StyleSheet.create** always - never inline style objects in render
3. **Accessibility** on every interactive element: `accessibilityRole`, `accessibilityLabel`
4. **Named exports** for components, not default exports (except route screens)
5. **Route screens** use `export default function` (Expo Router requirement)
6. **Colocate styles** at bottom of component file
7. **Colors** always from `constants/colors.ts` - never hardcode hex values
8. **Types** colocated if single-file, in `src/types/` if shared across 2+ files

## When to Extract

- **Extract component** when: same UI pattern appears in 2+ places, or screen file > 200 lines
- **Extract hook** when: stateful logic is reusable or complex enough to test independently
- **Extract service** when: adding real API calls (replace mock data imports)
- **Don't extract** when: it's used once and the screen is readable

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Putting components in `app/` | Components go in `src/components/` |
| Hardcoded color values | Import from `constants/colors.ts` |
| Missing accessibility props | Every touchable needs role + label |
| `export default` on shared components | Use named exports for non-route components |
