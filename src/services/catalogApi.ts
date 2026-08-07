import { graphqlRequest } from "./graphqlClient";

import type {
  SearchSuggestions,
  VenueCard,
  VenueDetail,
} from "../types/catalog";

// Service selection shared by venue detail + home venue.
const VENUE_SERVICE_FIELDS = /* GraphQL */ `
  id
  name
  description
  duration
  price
  currency
  categoryId
  categoryName
`;

// Fields shared by the venue list card and the venue detail.
const VENUE_CARD_FIELDS = /* GraphQL */ `
  id
  name
  logoUrl
  description
  address
  city
  timezone
  serviceCount
  priceFrom
  categoryTags
  openNow
  hoursToday
  rating
  distanceKm
`;

const VENUES_QUERY = /* GraphQL */ `
  query Venues($pagination: PaginationInput, $filter: VenueFilterInput) {
    venues(pagination: $pagination, filter: $filter) {
      items {
        ${VENUE_CARD_FIELDS}
      }
      meta {
        totalItems
        currentPage
        totalPages
      }
    }
  }
`;

const VENUE_QUERY = /* GraphQL */ `
  query Venue($id: ID!) {
    venue(id: $id) {
      ${VENUE_CARD_FIELDS}
      about
      services {
        ${VENUE_SERVICE_FIELDS}
      }
      team {
        id
        firstName
        lastName
        jobTitle
        bio
      }
    }
  }
`;

// Customer Home landing (BOOK-67): the venue card + its bookable services and
// the categories that group them.
const HOME_VENUE_QUERY = /* GraphQL */ `
  query HomeVenue($venueId: ID) {
    homeVenue(venueId: $venueId) {
      ${VENUE_CARD_FIELDS}
      about
      categories {
        id
        name
      }
      services {
        ${VENUE_SERVICE_FIELDS}
      }
    }
  }
`;

const NOTIFY_WHEN_BOOKING_OPENS = /* GraphQL */ `
  mutation NotifyWhenBookingOpens($companyId: ID!) {
    notifyWhenBookingOpens(companyId: $companyId)
  }
`;

// Live search suggestions (BOOK-68).
const SEARCH_SUGGESTIONS_QUERY = /* GraphQL */ `
  query SearchSuggestions($query: String!, $serviceLimit: Int, $venueLimit: Int) {
    searchSuggestions(query: $query, serviceLimit: $serviceLimit, venueLimit: $venueLimit) {
      services {
        id
        name
        categoryName
        categoryMatched
        duration
        price
        currency
        venueId
        venueName
      }
      venues {
        id
        name
        matchedLabel
        rating
        logoUrl
      }
    }
  }
`;

export interface VenueFilter {
  search?: string;
  categoryId?: string;
  city?: string;
  openNow?: boolean;
}

interface Paginated<T> {
  items: T[];
  meta: { totalItems: number; currentPage: number; totalPages: number };
}

/** Search / list venues (companies) for discovery. */
export async function fetchVenues(
  filter: VenueFilter = {},
  pagination: { page?: number; limit?: number } = {},
): Promise<Paginated<VenueCard>> {
  const data = await graphqlRequest<{ venues: Paginated<VenueCard> }>(
    VENUES_QUERY,
    {
      filter,
      pagination: { page: pagination.page ?? 1, limit: pagination.limit ?? 20 },
    },
  );
  return data.venues;
}

/** Full venue profile: company + its services, team, hours. */
export async function fetchVenue(id: string): Promise<VenueDetail> {
  const data = await graphqlRequest<{ venue: VenueDetail }>(VENUE_QUERY, { id });
  return data.venue;
}

/**
 * The customer Home venue: the given venue when `venueId` is passed (e.g. the
 * last one viewed), otherwise the backend's default active venue.
 */
export async function fetchHomeVenue(venueId?: string): Promise<VenueDetail> {
  const data = await graphqlRequest<{ homeVenue: VenueDetail }>(HOME_VENUE_QUERY, {
    venueId: venueId ?? null,
  });
  return data.homeVenue;
}

/** Register the signed-in customer to be notified when this venue opens booking. */
export async function notifyWhenBookingOpens(companyId: string): Promise<boolean> {
  const data = await graphqlRequest<{ notifyWhenBookingOpens: boolean }>(
    NOTIFY_WHEN_BOOKING_OPENS,
    { companyId },
  );
  return data.notifyWhenBookingOpens;
}

/** Live search suggestions for the Search screen (services + venues). */
export async function fetchSearchSuggestions(
  query: string,
  opts: { serviceLimit?: number; venueLimit?: number } = {},
): Promise<SearchSuggestions> {
  const data = await graphqlRequest<{ searchSuggestions: SearchSuggestions }>(
    SEARCH_SUGGESTIONS_QUERY,
    {
      query,
      serviceLimit: opts.serviceLimit ?? 5,
      venueLimit: opts.venueLimit ?? 3,
    },
  );
  return data.searchSuggestions;
}
