import { graphqlRequest } from "./graphqlClient";

import type { AuthPayload, FirebaseAuthInput } from "../types/auth";

const USER_EXISTS_QUERY = /* GraphQL */ `
  query UserExists($phone: String!) {
    userExists(phone: $phone)
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

/** True only for a REGISTERED customer with this phone (login vs. register branch). */
export async function userExists(phone: string): Promise<boolean> {
  const data = await graphqlRequest<{ userExists: boolean }>(
    USER_EXISTS_QUERY,
    { phone },
    { withAuth: false },
  );
  return data.userExists;
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
