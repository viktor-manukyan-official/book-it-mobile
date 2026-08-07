// Customer-facing catalog/discovery types. These mirror the public venue-discovery
// API (BOOK-56): a "venue" is a Company presented at its primary Location.

export interface VenueCard {
  id: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  address: string;
  city: string;
  timezone: string;
  serviceCount: number;
  priceFrom?: number | null;
  categoryTags: string[];
  openNow: boolean;
  hoursToday?: string | null;
  rating?: number | null;
  distanceKm?: number | null;
}

export interface ServiceLite {
  id: string;
  name: string;
  description?: string | null;
  duration: number; // minutes
  price: number;
  currency: string;
  categoryId?: string | null;
  categoryName?: string | null;
}

export interface VenueCategory {
  id: string;
  name: string;
}

// Live search suggestions (BOOK-68).
export interface ServiceSuggestion {
  id: string;
  name: string;
  categoryName?: string | null;
  categoryMatched: boolean;
  duration: number;
  price: number;
  currency: string;
  venueId: string;
  venueName: string;
}

export interface VenueSuggestion {
  id: string;
  name: string;
  matchedLabel?: string | null;
  rating?: number | null;
  logoUrl?: string | null;
}

export interface SearchSuggestions {
  services: ServiceSuggestion[];
  venues: VenueSuggestion[];
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  bio?: string | null;
}

export interface VenueDetail extends VenueCard {
  services: ServiceLite[];
  categories: VenueCategory[];
  team: TeamMember[];
  about?: string | null;
}
