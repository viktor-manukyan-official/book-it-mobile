@AGENTS.md

# BookIt Mobile - Project Instructions

## Project Overview

**BookIt (YerevanBook)** is a mobile app for discovering and booking beauty services (salons, barbershops, clinics) in Yerevan, Armenia. Built with Expo SDK 57, React Native 0.86, and TypeScript in strict mode.

## Tech Stack

- **Framework**: Expo SDK 57 + React Native 0.86
- **Routing**: Expo Router v57 (file-based)
- **Language**: TypeScript 6 (strict mode)
- **Styling**: React Native StyleSheet (no external CSS libs)
- **Linting**: ESLint with expo flat config
- **State**: React hooks (useState, useMemo) — no external state lib yet
- **Icons**: @expo/vector-icons (Ionicons)

## Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
npm run lint       # Run ESLint
npx tsc --noEmit   # TypeScript type check
```

## Architecture

```
app/                    # Route screens (Expo Router)
  _layout.tsx           # Root Stack navigator
  (tabs)/               # Tab navigator group
    _layout.tsx         # Tab config (Explore, Profile)
    index.tsx           # Home/Explore screen
    profile.tsx         # Profile screen
  salon/
    [id].tsx            # Salon detail (dynamic route)
src/
  components/           # Reusable UI components
  hooks/                # Custom React hooks
  services/             # API clients, external integrations
  types/                # Shared TypeScript interfaces
  screens/              # Complex screen logic (overflow from app/)
  navigation/           # Navigation utilities
constants/
  colors.ts             # Design system color tokens
data/
  mock.ts               # Mock data + types (temporary)
```

## Key Conventions

1. **Expo v57 docs first**: Read https://docs.expo.dev/versions/v57.0.0/ before writing code
2. **File-based routing**: Every screen is a file in `app/` — use `expo-router` APIs only
3. **Colors from constants**: Always use `Colors` from `@/constants/colors` — no hardcoded hex
4. **Accessibility required**: Every interactive element needs `accessibilityRole` + `accessibilityLabel`
5. **Safe areas**: All screens use `SafeAreaView` or `useSafeAreaInsets()`
6. **Armenian Dram**: Use `formatPrice()` from `data/mock.ts` for currency — integer values only
7. **Named exports** for shared components, `export default` only for route screens
8. **Commit format**: `type(BOOK-XX): description` — feat, fix, docs, refactor, test, chore

## Skills

Project-level skills are available in `.claude/skills/`:
- **expo-routing** — Navigation patterns, adding screens/tabs, Expo Router usage
- **component-architecture** — Where to put code, extraction rules, component patterns
- **booking-domain** — Business logic, data models, booking flow state machine
- **styling-patterns** — Design system, card/button patterns, spacing/radius tokens
- **data-layer** — Mock-to-API migration path, hooks pattern, service layer
- **testing-strategy** — Jest + RNTL setup, what to test, component test patterns
- **accessibility** — Required props by element, screen reader patterns
- **code-quality** — TypeScript rules, naming, imports, commit conventions
