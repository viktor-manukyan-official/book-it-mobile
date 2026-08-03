import { graphqlRequest } from "./graphqlClient";

import type { AuthPayload, FirebaseAuthInput } from "../types/auth";

const PHONE_EXISTS_QUERY = /* GraphQL */ `
  query PhoneExists($phone: String!) {
    phoneExists(phone: $phone)
  }
`;

const AUTHENTICATE_MUTATION = /* GraphQL */ `
  mutation AuthenticateWithFirebase($input: FirebaseAuthInput!) {
    authenticateWithFirebase(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        firstName
        lastName
        profileImageUrl
        emailVerified
        mustChangePassword
        roles {
          id
          name
        }
      }
    }
  }
`;

/** Check whether a customer with this E.164 phone already exists. */
export async function phoneExists(phone: string): Promise<boolean> {
  const data = await graphqlRequest<{ phoneExists: boolean }>(
    PHONE_EXISTS_QUERY,
    { phone },
    { withAuth: false },
  );
  return data.phoneExists;
}

/**
 * Exchange a verified Firebase ID token (+ optional registration details) for a
 * BookIt JWT session. On the new-user path firstName/lastName/email are required.
 */
export async function authenticateWithFirebase(
  input: FirebaseAuthInput,
): Promise<AuthPayload> {
  const data = await graphqlRequest<{ authenticateWithFirebase: AuthPayload }>(
    AUTHENTICATE_MUTATION,
    { input },
    { withAuth: false },
  );
  return data.authenticateWithFirebase;
}
