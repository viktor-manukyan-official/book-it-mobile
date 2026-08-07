import { graphqlRequest } from "./graphqlClient";

import type {
  AvailableSlot,
  BookingTechnician,
  DayAvailability,
  GenderPref,
} from "../types/catalog";

// Booking availability (BOOK-72). These queries require auth (the customer is
// signed in by the time they reach booking); graphqlRequest attaches the token.

const SERVICE_TECHNICIANS_QUERY = /* GraphQL */ `
  query ServiceTechnicians($serviceId: ID!, $locationId: ID!, $gender: String) {
    serviceTechnicians(serviceId: $serviceId, locationId: $locationId, gender: $gender) {
      id
      firstName
      initials
      profileImageUrl
      gender
    }
  }
`;

const BOOKING_SLOTS_QUERY = /* GraphQL */ `
  query BookingSlots($serviceId: ID!, $locationId: ID!, $date: String!, $gender: String, $technicianId: ID) {
    bookingSlots(
      serviceId: $serviceId
      locationId: $locationId
      date: $date
      gender: $gender
      technicianId: $technicianId
    ) {
      date
      slots {
        startTime
        endTime
        technicianId
        technicianName
      }
    }
  }
`;

const AVAILABILITY_CALENDAR_QUERY = /* GraphQL */ `
  query AvailabilityCalendar(
    $serviceId: ID!
    $locationId: ID!
    $fromDate: String!
    $toDate: String!
    $gender: String
    $technicianId: ID
  ) {
    availabilityCalendar(
      serviceId: $serviceId
      locationId: $locationId
      fromDate: $fromDate
      toDate: $toDate
      gender: $gender
      technicianId: $technicianId
    ) {
      date
      status
      hasAvailability
    }
  }
`;

function genderArg(g: GenderPref): string | null {
  return g === "any" ? null : g;
}

export async function fetchServiceTechnicians(
  serviceId: string,
  locationId: string,
  gender: GenderPref,
): Promise<BookingTechnician[]> {
  const data = await graphqlRequest<{ serviceTechnicians: BookingTechnician[] }>(
    SERVICE_TECHNICIANS_QUERY,
    { serviceId, locationId, gender: genderArg(gender) },
  );
  return data.serviceTechnicians;
}

export async function fetchBookingSlots(
  serviceId: string,
  locationId: string,
  date: string,
  gender: GenderPref,
  technicianId: string | null,
): Promise<{ date: string; slots: AvailableSlot[] }> {
  const data = await graphqlRequest<{
    bookingSlots: { date: string; slots: AvailableSlot[] };
  }>(BOOKING_SLOTS_QUERY, {
    serviceId,
    locationId,
    date,
    gender: genderArg(gender),
    technicianId: technicianId ?? null,
  });
  return data.bookingSlots;
}

export async function fetchAvailabilityCalendar(
  serviceId: string,
  locationId: string,
  fromDate: string,
  toDate: string,
  gender: GenderPref,
  technicianId: string | null,
): Promise<DayAvailability[]> {
  const data = await graphqlRequest<{ availabilityCalendar: DayAvailability[] }>(
    AVAILABILITY_CALENDAR_QUERY,
    {
      serviceId,
      locationId,
      fromDate,
      toDate,
      gender: genderArg(gender),
      technicianId: technicianId ?? null,
    },
  );
  return data.availabilityCalendar;
}
