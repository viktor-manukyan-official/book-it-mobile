import { graphqlRequest } from "./graphqlClient";

import type { UserProfile } from "../types/auth";

export interface NotificationPreferences {
  bookingConfirmations: boolean;
  reminders: boolean;
  changes: boolean;
  push: boolean;
  sms: boolean;
  promotions: boolean;
}

const USER_FIELDS = /* GraphQL */ `
  id
  email
  phone
  firstName
  lastName
  profileImageUrl
  emailVerified
  mustChangePassword
  roles { id name }
`;

const ME_QUERY = /* GraphQL */ `
  query Me { me { ${USER_FIELDS} } }
`;

const UPDATE_PROFILE_MUTATION = /* GraphQL */ `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) { ${USER_FIELDS} }
  }
`;

/** Refresh the current user profile from the server (hydrates phone, etc.). */
export async function fetchMe(): Promise<UserProfile> {
  const data = await graphqlRequest<{ me: UserProfile }>(ME_QUERY);
  return data.me;
}

const PREFERENCES_FIELDS = /* GraphQL */ `
  bookingConfirmations
  reminders
  changes
  push
  sms
  promotions
`;

const MY_PREFERENCES_QUERY = /* GraphQL */ `
  query MyNotificationPreferences {
    myNotificationPreferences { ${PREFERENCES_FIELDS} }
  }
`;

const UPDATE_PREFERENCES_MUTATION = /* GraphQL */ `
  mutation UpdateNotificationPreferences($input: UpdateNotificationPreferencesInput!) {
    updateNotificationPreferences(input: $input) { ${PREFERENCES_FIELDS} }
  }
`;

export async function updateProfile(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<UserProfile> {
  const data = await graphqlRequest<{ updateProfile: UserProfile }>(UPDATE_PROFILE_MUTATION, {
    input,
  });
  return data.updateProfile;
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const data = await graphqlRequest<{ myNotificationPreferences: NotificationPreferences }>(
    MY_PREFERENCES_QUERY,
  );
  return data.myNotificationPreferences;
}

export async function updateNotificationPreferences(
  input: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const data = await graphqlRequest<{ updateNotificationPreferences: NotificationPreferences }>(
    UPDATE_PREFERENCES_MUTATION,
    { input },
  );
  return data.updateNotificationPreferences;
}
