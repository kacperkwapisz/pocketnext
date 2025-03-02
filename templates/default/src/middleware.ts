import { updateSession } from "@/lib/pocketbase/middleware";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - assets (assets)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - site.webmanifest (web manifest file)
     */
    "/((?!_next/static|_next/image|assets|favicon.ico|sitemap.xml|robots.txt|site.webmanifest).*)",
  ],
};
