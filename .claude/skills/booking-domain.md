---
name: booking-domain
description: Use when implementing booking flows, salon/service data models, availability logic, appointment management, or any feature touching the core BookIt business domain.
---

# BookIt Domain Logic

## Overview
BookIt is a salon/service booking app for Yerevan, Armenia. All business logic must respect the domain model, currency formatting, and booking flow.

## Domain Model

```typescript
// Current types (data/mock.ts) - will migrate to src/types/
interface Salon {
  id: string;
  name: string;
  category: 'salon' | 'barbershop' | 'clinic';
  area: string;           // Yerevan district
  rating: number;         // 1-5 scale
  reviewCount: number;
  address: string;
  hours: string;          // e.g. "10:00 - 20:00"
  description: string;
  coverColor: string;     // Hex color for salon branding
  services: Service[];
  timeSlots: string[];    // Available times e.g. ["10:00", "11:30"]
}

interface Service {
  name: string;
  price: number;          // In Armenian Dram (AMD)
  duration: string;       // e.g. "60 min"
}
```

## Business Rules

1. **Currency**: Always Armenian Dram (AMD). Format with `formatPrice()` from `data/mock.ts` which appends ֏ symbol
2. **Categories**: Only `salon`, `barbershop`, `clinic`. Map to display names via `CATEGORY_FILTER_MAP`
3. **Time slots**: 30-minute intervals within salon operating hours
4. **Booking flow**: Select salon -> Select service -> Select time slot -> Confirm
5. **Ratings**: Display to 1 decimal place with star icon, show review count

## Booking State Machine

```
BROWSING -> SERVICE_SELECTED -> TIME_SELECTED -> CONFIRMING -> BOOKED
    |              |                  |              |
    v              v                  v              v
  (filter/      (change           (change         (cancel ->
   search)       service)          time)           BROWSING)
```

## Adding New Features

When adding booking features:
- Keep mock data pattern until real API is integrated
- New data fields go in `data/mock.ts` types first
- Price calculations must use integer AMD values (no floating point currency)
- All user-facing text should be English (i18n will come later)
- District/area names use English transliterations of Yerevan districts

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Floating point for prices | Use integer AMD values |
| Missing ֏ symbol | Use `formatPrice()` helper |
| New category without updating filter | Add to both `CATEGORIES` and `CATEGORY_FILTER_MAP` |
| Hardcoded salon data in screens | Import from `data/mock.ts` |
