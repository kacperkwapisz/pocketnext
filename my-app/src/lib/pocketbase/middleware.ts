import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { COOKIE_NAME } from "./server";
import { SyncAuthStore } from "./stores/sync-auth-store";
import { TypedPocketBase } from "./types";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next();

    const client = new PocketBase(
        process.env.NEXT_PUBLIC_POCKETBASE_URL,
        new SyncAuthStore({
            save: async (serializedPayload) => {
                request.cookies.set(COOKIE_NAME, serializedPayload);
                response = NextResponse.next({
                    request,
                });
                response.cookies.set(COOKIE_NAME, serializedPayload);
            },
            clear: async () => {
                request.cookies.delete(COOKIE_NAME);
                response = NextResponse.next({
                    request,
                });
                response.cookies.delete(COOKIE_NAME);
            },
            initial: request.cookies.get(COOKIE_NAME)?.value,
        }),
    ) as TypedPocketBase;

    // Check if the session is still valid
    // IMPORTANT: We must check if the authStore is valid before proceeding with any requests
    if (client.authStore.isValid) {
        try {
            await client.collection("users").authRefresh();

            // Redirect logged-in users away from auth pages
            if (["/login", "/register"].includes(request.nextUrl.pathname)) {
                const url = request.nextUrl.clone();
                url.pathname = "/";
                response = NextResponse.redirect(url);
                return response;
            }

            // If user is logged in but not approved, redirect to invite page
            // except if they're already on the invite page
            if (!client.authStore.record?.isApproved && !request.nextUrl.pathname.startsWith('/invite')) {
                const url = request.nextUrl.clone();
                url.pathname = "/invite";
                response = NextResponse.redirect(url);
            }
        } catch {
            client.authStore.clear();
        }
    }

    // Allow access to public pages
    if (
        !client.authStore.isValid &&
        !["/", "/login", "/register", "/invite"].includes(request.nextUrl.pathname)
    ) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        response = NextResponse.redirect(url);
    }

    return response;
}