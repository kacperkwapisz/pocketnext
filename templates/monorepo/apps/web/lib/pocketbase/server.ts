/**
 * Server-side PocketBase integration
 *
 * This file contains ONLY server-side code and should NEVER be
 * imported in client components.
 */

import { cookies } from "next/headers";
import PocketBase, { AsyncAuthStore } from "pocketbase";
import "server-only";
import { TypedPocketBase } from "@repo/db";

// Cookie name for PocketBase authentication
export const COOKIE_NAME = "pb_auth";

/**
 * Create a PocketBase client with cookie auth for server components
 *
 * This should only be called in Server Components or API Routes
 */
export async function createClient() {
  const cookieStore = await cookies();

  const client = new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_URL,
    new AsyncAuthStore({
      save: async (serializedPayload) => {
        try {
          cookieStore.set(COOKIE_NAME, serializedPayload);
        } catch {
          // This method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      clear: async () => {
        try {
          cookieStore.delete(COOKIE_NAME);
        } catch {
          // This method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      initial: cookieStore.get(COOKIE_NAME)?.value,
    })
  ) as TypedPocketBase;

  return client;
}

/**
 * Get the current authenticated user from server context
 *
 * This should only be called in Server Components or API Routes
 */
export async function getCurrentUser() {
  const pb = await createClient();

  try {
    if (pb.authStore.isValid) {
      const userId = pb.authStore.model?.id;
      if (userId) {
        return await pb.collection("users").getOne(userId);
      }
    }
  } catch (error) {
    console.error("Error getting current user:", error);
  }

  return null;
}

/**
 * Check PocketBase health status
 */
export async function getPocketBaseHealth() {
  const pb = await createClient();

  try {
    const health = await pb.health.check();
    return {
      status: "Connected",
      version: health.code === 200 ? "OK" : "Error",
    };
  } catch (error) {
    console.error("PocketBase health check failed:", error);
    return {
      status: "Disconnected",
      version: "Unknown",
      error,
    };
  }
}
