---
name: testing-strategy
description: Use when writing tests, setting up test infrastructure, or deciding what and how to test in the BookIt Expo app. Triggers on test files, jest config, or testing discussions.
---

# Testing Strategy

## Overview
BookIt uses Jest + React Native Testing Library for unit/component tests. Test behavior, not implementation.

## Setup

```bash
npx expo install jest-expo jest @testing-library/react-native @testing-library/jest-native
```

**jest.config.js:**
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterSetup: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
};
```

## What to Test

| Priority | What | How |
|----------|------|-----|
| High | Business logic (filtering, formatting, booking state) | Unit tests |
| High | User interactions (tap salon, select time, book) | Component tests with RNTL |
| Medium | Navigation flows | Integration tests |
| Medium | Data hooks | Hook testing with renderHook |
| Low | Static display (layout, styling) | Visual regression (later) |

## Test File Location

```
__tests__/
  components/
    SalonCard.test.tsx
  hooks/
    useSalons.test.ts
  screens/
    HomeScreen.test.tsx
  utils/
    formatPrice.test.ts
```

## Component Test Pattern

```typescript
import { render, fireEvent, screen } from '@testing-library/react-native';
import { SalonCard } from '@/src/components/SalonCard';

const mockSalon = {
  id: '1',
  name: 'Test Salon',
  category: 'salon' as const,
  rating: 4.5,
  reviewCount: 100,
  // ... minimal required fields
};

describe('SalonCard', () => {
  it('displays salon name and rating', () => {
    render(<SalonCard salon={mockSalon} onPress={jest.fn()} />);
    expect(screen.getByText('Test Salon')).toBeTruthy();
    expect(screen.getByText('4.5')).toBeTruthy();
  });

  it('calls onPress with salon id when tapped', () => {
    const onPress = jest.fn();
    render(<SalonCard salon={mockSalon} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledWith('1');
  });
});
```

## Rules

1. **Test user behavior**, not implementation details
2. **Query by accessibility role/label** first, text second, testID last
3. **No snapshot tests** unless explicitly requested
4. **Mock at service boundary** (`src/services/`), not internal hooks
5. **Each test is independent** - no shared mutable state between tests
6. **Arrange-Act-Assert** pattern in every test

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Testing style values | Test visible behavior instead |
| Mocking hooks directly | Mock the service layer, let hooks run |
| No act() wrapper for state updates | Use RNTL's fireEvent which handles this |
| Testing internal state | Test what the user sees/does |
