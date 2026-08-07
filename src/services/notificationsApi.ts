import { graphqlRequest } from "./graphqlClient";

import type { AppNotification } from "../types/catalog";

// Generic notifications (BOOK-78) — JWT-scoped to the signed-in customer.

const NOTIFICATION_FIELDS = /* GraphQL */ `
  id
  type
  title
  body
  data
  read
  createdAt
`;

const MY_NOTIFICATIONS_QUERY = /* GraphQL */ `
  query MyNotifications($pagination: PaginationInput, $filter: MyNotificationsFilterInput) {
    myNotifications(pagination: $pagination, filter: $filter) {
      items { ${NOTIFICATION_FIELDS} }
      meta { totalItems currentPage totalPages }
    }
  }
`;

const UNREAD_COUNT_QUERY = /* GraphQL */ `
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

const MARK_READ_MUTATION = /* GraphQL */ `
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) { id read }
  }
`;

const MARK_ALL_READ_MUTATION = /* GraphQL */ `
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export async function fetchNotifications(
  page = 1,
  limit = 20,
  filter?: { read?: boolean; type?: string },
): Promise<{
  items: AppNotification[];
  meta: { totalItems: number; currentPage: number; totalPages: number };
}> {
  const data = await graphqlRequest<{
    myNotifications: {
      items: AppNotification[];
      meta: { totalItems: number; currentPage: number; totalPages: number };
    };
  }>(MY_NOTIFICATIONS_QUERY, { pagination: { page, limit }, filter: filter ?? null });
  return data.myNotifications;
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await graphqlRequest<{ unreadNotificationCount: number }>(UNREAD_COUNT_QUERY);
  return data.unreadNotificationCount;
}

export async function markNotificationRead(id: string): Promise<void> {
  await graphqlRequest(MARK_READ_MUTATION, { id });
}

export async function markAllNotificationsRead(): Promise<void> {
  await graphqlRequest(MARK_ALL_READ_MUTATION);
}
