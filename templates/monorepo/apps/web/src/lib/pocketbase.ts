import { createClientFromEnv } from "@repo/db";

export const pocketbase = createClientFromEnv();

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://localhost:8090";
}

/**
 * Functions to encapsulate PocketBase operations with our typesafe client
 */
export const pb = {
  /**
   * Get the URL of the PocketBase server
   */
  baseUrl: getBaseUrl(),

  /**
   * Get the authenticated user, if any
   */
  getUser: () => {
    return pocketbase.authStore.model;
  },

  /**
   * Check if a user is authenticated
   */
  isAuthenticated: () => {
    return pocketbase.authStore.isValid;
  },

  /**
   * Get the current auth token, if any
   */
  getToken: () => {
    return pocketbase.authStore.token;
  },

  /**
   * Logout the current user
   */
  logout: () => {
    pocketbase.authStore.clear();
  },
};

export default pb;
