---
name: styling-patterns
description: Use when styling components, creating layouts, implementing responsive design, theming, or fixing visual issues in the BookIt React Native app.
---

# Styling Patterns

## Overview
BookIt uses React Native StyleSheet with a centralized color system. No external styling libraries (no NativeWind, no styled-components).

## Design System

**Colors** (from `constants/colors.ts`):
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#FF6B6B` | Buttons, active tabs, accents |
| `background` | `#F5F5F7` | Screen backgrounds |
| `card` | `#FFFFFF` | Cards, elevated surfaces |
| `textPrimary` | `#1A1A2E` | Headings, primary text |
| `textSecondary` | `#6B7280` | Subtitles, secondary info |
| `textLight` | `#9CA3AF` | Placeholders, disabled text |
| `border` | `#E5E7EB` | Dividers, input borders |
| `star` | `#F59E0B` | Rating stars |

**Spacing**: Multiples of 4px (4, 8, 12, 16, 20, 24, 32)

**Border Radius**: 8px (inputs), 12px (small cards), 16px (cards), 20px (buttons), full (avatars)

**Typography**: System fonts, no custom fonts loaded

## Rules

1. **Always `StyleSheet.create`** - never pass raw objects to `style`
2. **Colors from constants** - import `Colors` from `@/constants/colors`, never hardcode
3. **Safe areas** - every full-screen view uses `SafeAreaView` or `useSafeAreaInsets()`
4. **Platform-aware shadows**:
   ```typescript
   // iOS
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.08,
   shadowRadius: 12,
   // Android
   elevation: 3,
   ```
5. **Flexbox for layout** - no absolute positioning unless for overlays/floating elements
6. **Status bar**: Dark content style (light background app)

## Card Pattern

```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
});
```

## Button Pattern

```typescript
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Inline style objects | Move to `StyleSheet.create` |
| `#FF6B6B` in component | `Colors.primary` |
| Missing `elevation` on Android | Add alongside iOS shadow props |
| Fixed pixel heights for scrollable content | Use `flex: 1` and `FlatList` |
| Percentage widths for cards | Use `marginHorizontal` with full width |
