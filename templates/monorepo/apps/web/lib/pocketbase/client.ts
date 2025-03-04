import PocketBase from "pocketbase";
import { TypedPocketBase } from "./types";

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

// For client-side usage
export const getPocketBase = () => {
  if (typeof window === "undefined") {
    return createClient();
  }

  // @ts-ignore - PocketBase is attached to the window object
  window.pocketbase = window.pocketbase || createClient();
  // @ts-ignore
  return window.pocketbase;
};
