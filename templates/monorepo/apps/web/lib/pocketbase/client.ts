"use client";

/**
 * Client-side PocketBase integration
 *
 * This file contains ONLY client-side code and is safe to import
 * in client components.
 */

import PocketBase from "pocketbase";
import { TypedPocketBase } from "@repo/db";

/**
 * Create a client-side PocketBase instance with cookie support
 */
export function createClient() {
  const client = new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_URL
  ) as TypedPocketBase;

  if (typeof document !== "undefined") {
    client.authStore.loadFromCookie(document.cookie);
    client.authStore.onChange(() => {
      document.cookie = client.authStore.exportToCookie({ httpOnly: false });
    });
  }

  return client;
}

// Create a singleton instance for client components
export const pb = createClient();

// Export useful auth utilities
export const isAuthenticated = () => pb.authStore.isValid;
export const getCurrentUser = () => pb.authStore.model;
export const logout = () => pb.authStore.clear();

// Helper for login
export async function login(email: string, password: string) {
  return await pb.collection("users").authWithPassword(email, password);
}

// Helper for registration
export async function register(data: {
  email: string;
  password: string;
  passwordConfirm: string;
  [key: string]: any;
}) {
  return await pb.collection("users").create(data);
}

export default pb;
