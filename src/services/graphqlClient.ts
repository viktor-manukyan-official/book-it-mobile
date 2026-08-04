import Constants from "expo-constants";

import { clearSession, getSession, saveSession } from "./session";

// Base API URL. Prefer EXPO_PUBLIC_API_URL, fall back to app.json `extra.apiUrl`,
// then a sensible localhost default for dev.
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv;
  }
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)
    ?.apiUrl;
  if (fromExtra) {
    return fromExtra;
  }
  // Public (mobile) API lives under /api — the client appends /graphql.
  return "http://localhost:3000/api";
}

const GRAPHQL_ENDPOINT = `${resolveApiUrl().replace(/\/$/, "")}/graphql`;

interface GraphQLError {
  message: string;
  extensions?: { code?: string };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export class GraphQLRequestError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "GraphQLRequestError";
    this.code = code;
  }
}

const REFRESH_MUTATION = /* GraphQL */ `
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      accessToken
      refreshToken
    }
  }
`;

// True when a GraphQL error means the access token was missing/expired/invalid.
function isUnauthorized(err: GraphQLError): boolean {
  return (
    err.extensions?.code === "UNAUTHENTICATED" ||
    /unauthorized|unauthenticated/i.test(err.message)
  );
}

// A single in-flight refresh shared across concurrent 401s, so a burst of
// requests triggers only one refresh round-trip.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  let response: Response;
  try {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: REFRESH_MUTATION,
        variables: { input: { refreshToken: session.refreshToken } },
      }),
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;
  const body = (await response.json()) as GraphQLResponse<{
    refreshToken: { accessToken: string; refreshToken: string };
  }>;
  const payload = body.data?.refreshToken;
  if (!payload || (body.errors?.length ?? 0) > 0) return null;

  await saveSession(payload);
  return payload.accessToken;
}

async function performRequest<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  token: string | null,
): Promise<GraphQLResponse<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new GraphQLRequestError("Network request failed. Please try again.");
  }

  if (!response.ok) {
    throw new GraphQLRequestError(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as GraphQLResponse<T>;
}

/**
 * Minimal fetch-based GraphQL client for the BookIt backend.
 * Attaches the stored BookIt access token as a Bearer header when a session
 * exists. On an auth failure it transparently refreshes the token once (using
 * the stored refresh token) and retries; if refresh fails the session is cleared.
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  { withAuth = true }: { withAuth?: boolean } = {},
): Promise<T> {
  const session = withAuth ? await getSession() : null;
  let body = await performRequest<T>(query, variables, session?.accessToken ?? null);

  // If auth failed and we have a session to refresh, refresh once and retry.
  if (
    withAuth &&
    session &&
    body.errors?.length &&
    body.errors.some(isUnauthorized)
  ) {
    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
    }
    const newToken = await refreshInFlight;
    if (newToken) {
      body = await performRequest<T>(query, variables, newToken);
    } else {
      // Refresh failed — the session is dead; drop it so the app re-authenticates.
      await clearSession();
    }
  }

  if (body.errors && body.errors.length > 0) {
    const first = body.errors[0];
    throw new GraphQLRequestError(first.message, first.extensions?.code);
  }

  if (!body.data) {
    throw new GraphQLRequestError("Empty response from server.");
  }

  return body.data;
}
