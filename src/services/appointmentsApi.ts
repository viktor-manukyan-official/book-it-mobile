import { graphqlRequest } from "./graphqlClient";

import type { Appointment } from "../types/appointment";

const MY_APPOINTMENTS_QUERY = /* GraphQL */ `
  query MyAppointments($pagination: PaginationInput) {
    myAppointments(pagination: $pagination) {
      items {
        id
        companyId
        status
        startTime
        endTime
        price
        currency
        service {
          id
          name
        }
        technician {
          id
          firstName
          lastName
        }
        location {
          id
          name
        }
      }
      meta {
        totalItems
        currentPage
        totalPages
      }
    }
  }
`;

interface Paginated<T> {
  items: T[];
  meta: { totalItems: number; currentPage: number; totalPages: number };
}

/** The signed-in customer's appointments (bookings) across all venues. */
export async function fetchMyAppointments(
  pagination: { page?: number; limit?: number } = {},
): Promise<Appointment[]> {
  const data = await graphqlRequest<{ myAppointments: Paginated<Appointment> }>(
    MY_APPOINTMENTS_QUERY,
    { pagination: { page: pagination.page ?? 1, limit: pagination.limit ?? 50 } },
  );
  return data.myAppointments.items;
}
