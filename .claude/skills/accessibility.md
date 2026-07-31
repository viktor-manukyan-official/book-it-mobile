---
name: accessibility
description: Use when adding interactive elements, building forms, creating custom components, or reviewing UI for accessibility compliance in the BookIt React Native app.
---

# Accessibility Standards

## Overview
BookIt ships with accessibility built in from day one. Every interactive element must be usable with screen readers (VoiceOver/TalkBack).

## Required Props by Element Type

| Element | Required Props |
|---------|---------------|
| Touchable/Pressable | `accessible`, `accessibilityRole="button"`, `accessibilityLabel` |
| Text input | `accessibilityLabel`, `accessibilityHint` (if placeholder isn't clear) |
| Image | `accessibilityLabel` (descriptive) or `accessible={false}` (decorative) |
| Toggle/Switch | `accessibilityRole="switch"`, `accessibilityState={{ checked }}` |
| Selected item | `accessibilityState={{ selected: true }}` |
| List | `accessibilityRole="list"` on container |
| Tab | `accessibilityRole="tab"`, `accessibilityState={{ selected }}` |
| Link | `accessibilityRole="link"` |

## Patterns Used in BookIt

```typescript
// Category filter button (selected state)
<TouchableOpacity
  accessible
  accessibilityRole="tab"
  accessibilityLabel={`Filter by ${category}`}
  accessibilityState={{ selected: activeCategory === category }}
>

// Salon card (button with context)
<TouchableOpacity
  accessible
  accessibilityRole="button"
  accessibilityLabel={`${salon.name}, rated ${salon.rating} stars, ${salon.reviewCount} reviews`}
>

// Time slot (selectable)
<TouchableOpacity
  accessible
  accessibilityRole="button"
  accessibilityLabel={`Time slot ${time}`}
  accessibilityState={{ selected: selectedTime === time }}
>
```

## Rules

1. **Every touchable gets a label** - no exceptions
2. **State changes announced** - use `accessibilityState` for selected/checked/disabled
3. **Decorative elements hidden** - `accessible={false}` on purely visual elements
4. **Meaningful labels** - "Book appointment at Kentron Spa" not "Button"
5. **No info in color alone** - always pair color with text/icon
6. **Touch targets** minimum 44x44 points

## Testing Accessibility

```bash
# iOS Simulator: Cmd+T to toggle VoiceOver
# Android Emulator: Settings > Accessibility > TalkBack

# In tests, query by role:
screen.getByRole('button', { name: 'Book Appointment' });
screen.getAllByRole('tab');
```
