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
  serviceNames?: string[];
  openNow: boolean;
  hoursToday?: string | null;
  statusLabel?: string | null;
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

// Explore results (BOOK-69): a page of venues + the category facet chips.
export interface ExploreResult {
  items: VenueCard[];
  meta: { totalItems: number; currentPage: number; totalPages: number };
  categories: VenueCategory[];
}

// Service details (BOOK-71).
export interface ServiceDetail {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: number;
  currency: string;
  categoryName?: string | null;
  venueId: string;
  venueName: string;
  venueAddress?: string | null;
  venueCity?: string | null;
  locationId: string;
  timezone: string;
  customerCanSelectTechnician: boolean;
  freeCancelMinutes: number;
  cancellationFee: number;
  cancellationFeeType: string; // 'fixed' | 'percentage'
  rating?: number | null;
  reviewCount?: number | null;
}

// Booking availability (BOOK-72).
export type GenderPref = "any" | "male" | "female";

export interface BookingTechnician {
  id: string;
  firstName: string;
  initials: string;
  profileImageUrl?: string | null;
  gender?: string | null;
}

export interface AvailableSlot {
  startTime: string; // ISO (UTC)
  endTime: string;
  technicianId: string;
  technicianName: string;
}

// A customer's own appointment, flattened for the confirmed / details screens (BOOK-74).
export interface CustomerAppointment {
  id: string;
  companyId: string;
  status: string; // 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  startTime: string; // ISO
  endTime: string;
  price: number;
  currency: string;
  serviceName: string;
  duration: number;
  freeCancelMinutes: number;
  cancellationFee: number;
  cancellationFeeType: string;
  technicianName: string;
  venueName: string;
  venueAddress?: string | null;
  venueCity?: string | null;
  timezone: string;
}

// A customer review (BOOK-77).
export interface Review {
  id: string;
  appointmentId: string;
  rating: number;
  tags: string[];
  note?: string | null;
}

// A row in the My Bookings list (BOOK-75).
export interface BookingListItem {
  id: string;
  status: string;
  startTime: string; // ISO
  price: number;
  currency: string;
  serviceId: string;
  serviceName: string;
  serviceActive: boolean;
  duration: number;
  technicianId: string;
  technicianName: string;
  venueName: string;
  timezone: string;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  status: "open" | "closed" | "holiday";
  hasAvailability?: boolean | null;
}

export interface ExploreFilter {
  search?: string;
  categoryId?: string;
  city?: string;
  openNow?: boolean;
  minRating?: number;
  sort?: "relevance" | "rating";
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  bio?: string | null;
}

export interface VenueWorkingHours {
  dayOfWeek: number; // 0=Sunday .. 6=Saturday
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface VenueDetail extends VenueCard {
  services: ServiceLite[];
  categories: VenueCategory[];
  team: TeamMember[];
  about?: string | null;
  phone?: string | null;
  reviewCount?: number | null;
  workingHours?: VenueWorkingHours[];
}
