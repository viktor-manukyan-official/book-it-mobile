---
name: code-quality
description: Use when reviewing code, setting up linting, enforcing conventions, handling TypeScript strict mode, or establishing coding standards for the BookIt project.
---

# Code Quality Standards

## Overview
BookIt enforces TypeScript strict mode, ESLint with Expo config, and consistent patterns across all files.

## TypeScript

- **Strict mode enabled** (`tsconfig.json` extends `expo/tsconfig.base` with `strict: true`)
- **No `any`** - use proper types or `unknown` with type guards
- **No type assertions** (`as Type`) unless interfacing with untyped libraries
- **Path aliases**: `@/` maps to project root (configured by Expo)

## ESLint

Config: `eslint.config.js` using `eslint-config-expo/flat`

```bash
npm run lint          # Run ESLint
```

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `SalonCard.tsx` |
| Hooks | camelCase with `use` prefix | `useSalons.ts` |
| Services | camelCase | `salonService.ts` |
| Types/Interfaces | PascalCase | `interface Salon` |
| Constants | UPPER_SNAKE_CASE | `CATEGORIES` |
| Files (non-component) | camelCase or kebab-case | `colors.ts`, `mock.ts` |
| Route files | lowercase with brackets | `[id].tsx` |
| CSS/Style keys | camelCase | `borderRadius` |

## Commit Convention

Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
Scope: ticket ID (e.g., `BOOK-05`) or area (e.g., `auth`, `booking`)

Examples from history:
```
feat(BOOK-05): add project directory structure for mobile app
docs: add README with setup instructions
feat(book-01): add YerevanBook mobile UI prototype
```

## Import Order

1. React / React Native
2. Expo / third-party libraries
3. `@/` path alias imports (internal)
4. Relative imports
5. Type-only imports last

## Rules

1. **No console.log in committed code** - use proper logging or remove
2. **No commented-out code** - delete it, git has history
3. **No unused imports/variables** - ESLint catches these
4. **Explicit return types on exported functions** (optional for simple components)
5. **One component per file** - exception: small helper components used only in that file
