import { graphqlRequest } from "./graphqlClient";

import type { VenueCard, VenueDetail } from "../types/catalog";

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
        id
        name
        description
        duration
        price
        currency
        categoryName
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
