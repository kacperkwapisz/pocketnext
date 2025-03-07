/**
 * Admin/Superuser PocketBase client
 *
 * This file provides a superuser client for admin operations in
 * server components or API routes. This should NEVER be used
 * in client components or exposed to the browser.
 */

import { env } from "process";
import PocketBase from "pocketbase";
import "server-only";

// Get admin credentials from environment variables
const ADMIN_EMAIL = env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = env.POCKETBASE_ADMIN_PASSWORD;
const pocketbaseUrl = env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

// Create a dedicated admin client
const adminClient = new PocketBase(pocketbaseUrl);

// Disable auto cancellation for server environments
adminClient.autoCancellation = false;

// Function to authenticate as admin
async function authenticateAsAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "Missing PocketBase admin credentials in environment variables"
    );
  }

  try {
    await adminClient.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD, {
      // Auto refresh if token expires in the next 30 minutes
      autoRefreshThreshold: 30 * 60,
    });
  } catch (error) {
    console.error("Failed to authenticate as admin:", error);
    throw error;
  }
}

// Ensure admin is authenticated before performing operations
export async function withAdmin<T>(
  operation: (pb: PocketBase) => Promise<T>
): Promise<T> {
  if (!adminClient.authStore.isValid) {
    await authenticateAsAdmin();
  }

  return operation(adminClient);
}

// Common admin operations
export async function createUserAsAdmin(userData: {
  email: string;
  password: string;
  passwordConfirm: string;
  [key: string]: any;
}) {
  return withAdmin(async (pb) => {
    return pb.collection("users").create(userData);
  });
}

export async function getUsersAsAdmin(filter = "", sort = "-created") {
  return withAdmin(async (pb) => {
    return pb.collection("users").getList(1, 100, { filter, sort });
  });
}

// Re-export the admin client as default (but be careful with usage)
export default adminClient;
