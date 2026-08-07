import { graphqlRequest, GraphQLRequestError } from "./graphqlClient";

import type {
  AvailableSlot,
  BookingTechnician,
  CustomerAppointment,
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

const CREATE_APPOINTMENT_MUTATION = /* GraphQL */ `
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      id
      status
      startTime
      endTime
      price
      currency
    }
  }
`;

export interface CreatedAppointment {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  price: number;
  currency: string;
}

export interface CreateAppointmentArgs {
  companyId: string;
  locationId: string;
  serviceId: string;
  technicianId: string;
  customerId: string;
  startTime: string; // ISO
  notes?: string;
}

// Distinguishes the "slot taken by someone else" outcome from other failures.
export class SlotTakenError extends Error {}

const MY_APPOINTMENT_QUERY = /* GraphQL */ `
  query MyAppointment($id: ID!) {
    myAppointment(id: $id) {
      id
      status
      startTime
      endTime
      price
      currency
      service {
        name
        duration
        freeCancelMinutes
        cancellationFee
        cancellationFeeType
      }
      technician {
        firstName
        lastName
      }
      location {
        name
        address
        city
        timezone
      }
    }
  }
`;

interface RawAppointment {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  price: number;
  currency: string;
  service: {
    name: string;
    duration: number;
    freeCancelMinutes: number;
    cancellationFee: number;
    cancellationFeeType: string;
  };
  technician: { firstName: string; lastName: string };
  location: { name: string; address?: string | null; city?: string | null; timezone: string };
}

/** Fetch one of the customer's appointments (deep-link / confirmation safe). */
export async function fetchMyAppointment(id: string): Promise<CustomerAppointment> {
  const data = await graphqlRequest<{ myAppointment: RawAppointment }>(MY_APPOINTMENT_QUERY, {
    id,
  });
  const a = data.myAppointment;
  return {
    id: a.id,
    status: a.status,
    startTime: a.startTime,
    endTime: a.endTime,
    price: a.price,
    currency: a.currency,
    serviceName: a.service.name,
    duration: a.service.duration,
    freeCancelMinutes: a.service.freeCancelMinutes,
    cancellationFee: a.service.cancellationFee,
    cancellationFeeType: a.service.cancellationFeeType,
    technicianName: `${a.technician.firstName} ${a.technician.lastName}`.trim(),
    venueName: a.location.name,
    venueAddress: a.location.address ?? null,
    venueCity: a.location.city ?? null,
    timezone: a.location.timezone,
  };
}

export async function createAppointment(
  args: CreateAppointmentArgs,
): Promise<CreatedAppointment> {
  try {
    const data = await graphqlRequest<{ createAppointment: CreatedAppointment }>(
      CREATE_APPOINTMENT_MUTATION,
      { input: { ...args, notes: args.notes || undefined } },
    );
    return data.createAppointment;
  } catch (err) {
    if (
      err instanceof GraphQLRequestError &&
      (err.code === "CONFLICT" || /already booked|no longer available|taken/i.test(err.message))
    ) {
      throw new SlotTakenError(err.message);
    }
    throw err;
  }
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
