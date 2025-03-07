/**
 * Next.js middleware
 */

import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { COOKIE_NAME } from "./lib/pocketbase/server";

/**
 * Middleware function that runs on specified routes
 */
export async function middleware(request: NextRequest) {
  try {
    // Get the authentication cookie from the request
    const authCookie = request.cookies.get(COOKIE_NAME);

    if (authCookie?.value) {
      // Create a new PocketBase instance for the middleware
      const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

      // Load the authentication state from the cookie
      pb.authStore.loadFromCookie(`${COOKIE_NAME}=${authCookie.value}`);

      // Check if the token is valid and not expired
      if (pb.authStore.isValid) {
        try {
          // Attempt to refresh the token
          await pb.collection("users").authRefresh();

          // If successful, get the updated cookie
          const updatedCookie = pb.authStore.exportToCookie();
          // Parse the cookie value (e.g., "pb_auth=COOKIE_VALUE")
          const cookieValue = updatedCookie.split("=")[1];

          // Create a new response
          const response = NextResponse.next();

          // Set the updated cookie in the response
          if (cookieValue) {
            response.cookies.set(COOKIE_NAME, cookieValue, {
              path: "/",
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              maxAge: 60 * 60 * 24 * 7, // 1 week
            });
          }

          return response;
        } catch (error) {
          console.error("Failed to refresh auth token:", error);
          // If refresh fails, clear the auth state
          pb.authStore.clear();
        }
      }
    }
  } catch (error) {
    console.error("Error in middleware auth refresh:", error);
  }

  // If we reach here, either there's no auth cookie or refresh failed
  return NextResponse.next();
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    // Only run on API routes and authenticated pages
    "/api/:path*",
    "/dashboard/:path*",
    "/account/:path*",
  ],
};
