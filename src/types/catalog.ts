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
  categoryName?: string | null;
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
  team: TeamMember[];
  about?: string | null;
}
