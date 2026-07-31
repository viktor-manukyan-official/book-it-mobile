---
name: data-layer
description: Use when adding API integration, replacing mock data, implementing state management, data fetching, caching, or offline support in the BookIt app.
---

# Data Layer Patterns

## Overview
BookIt currently uses mock data from `data/mock.ts`. This skill guides the transition to real APIs and proper state management.

## Current State

All data lives in `data/mock.ts`:
- `SALONS` array with hardcoded salon objects
- `CATEGORIES` and `CATEGORY_FILTER_MAP` for filtering
- `PROFILE_MENU_ITEMS` for profile screen
- `formatPrice()` utility
- TypeScript interfaces: `Salon`, `Service`, `ProfileMenuItem`

## Migration Path

### Phase 1: Extract Types
Move interfaces from `data/mock.ts` to `src/types/`:
```
src/types/
  salon.ts      # Salon, Service interfaces
  booking.ts    # Booking, TimeSlot interfaces
  user.ts       # User, Profile interfaces
  index.ts      # Re-exports
```

### Phase 2: Add Service Layer
```
src/services/
  api.ts        # Base API client (fetch wrapper)
  salons.ts     # Salon API calls
  bookings.ts   # Booking API calls
  auth.ts       # Authentication
```

### Phase 3: Custom Hooks
```
src/hooks/
  useSalons.ts       # Fetch & filter salons
  useSalonDetail.ts  # Single salon with services
  useBooking.ts      # Booking flow state
  useAuth.ts         # Auth state
```

## Rules

1. **No direct fetch in components** - always go through `src/services/` -> `src/hooks/`
2. **Mock data stays until API exists** - don't delete `data/mock.ts` prematurely
3. **Types are source of truth** - API responses must conform to TypeScript interfaces
4. **Loading + error + empty states** - every data-dependent screen handles all three
5. **Keep `formatPrice()` in utilities** - currency formatting is not a service concern

## Hook Pattern

```typescript
// src/hooks/useSalons.ts
import { useState, useEffect, useMemo } from 'react';
import { SALONS, CATEGORY_FILTER_MAP } from '@/data/mock';
import type { Salon } from '@/data/mock';

export function useSalons(activeCategory: string) {
  const [salons, setSalons] = useState<Salon[]>(SALONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const filterValue = CATEGORY_FILTER_MAP[activeCategory];
    if (!filterValue) return salons;
    return salons.filter(s => s.category === filterValue);
  }, [salons, activeCategory]);

  return { salons: filtered, loading, error };
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Fetching data in component body | Use custom hook with useEffect |
| Forgetting loading state | Always show skeleton/spinner while loading |
| No error handling | Display user-friendly error with retry |
| Mutating mock data directly | Treat mock arrays as immutable |
