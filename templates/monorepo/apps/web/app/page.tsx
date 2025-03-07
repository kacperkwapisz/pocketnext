import Link from "next/link";
import { getPocketBaseHealth, createClient } from "@/lib/pocketbase/server";
import { Button } from "@repo/ui/components/button";
import PocketBaseExample from "@/components/pocketbase-example";

export default async function Home() {
  // Demonstrate PocketBase connection in server component
  const { status: connectionStatus, version } = await getPocketBaseHealth();

  // Create a PocketBase client for this request
  const pb = createClient();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <div className="flex place-items-center gap-2 p-8 lg:p-0">
            By{" "}
            <Button
              className="font-medium"
              variant="link"
              href="https://github.com/yourusername/pocketnext"
            >
              PocketNext
            </Button>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mb-32 text-center">
        <h1 className="mt-20 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          PocketNext
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          A powerful Next.js monorepo with PocketBase integration
        </p>

        {/* PocketBase connection status */}
        <div className="my-8 bg-white p-6 rounded-lg border border-gray-200 w-full">
          <h2 className="text-xl font-semibold mb-4">PocketBase Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-sm opacity-70">Connection</span>
              <span className="font-medium">
                {connectionStatus === "Connected" ? (
                  <span className="text-green-500 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Connected
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    Not Connected
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm opacity-70">Version</span>
              <span className="font-medium">{version || "Unknown"}</span>
            </div>
          </div>
        </div>

        {/* Client-side PocketBase example */}
        <div className="my-8 w-full">
          <PocketBaseExample />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
          <div className="rounded-lg border p-4 text-left">
            <h2 className="text-xl font-semibold mb-2">Monorepo Structure</h2>
            <p>
              Organize your code into apps and packages for better
              maintainability.
            </p>
          </div>
          <div className="rounded-lg border p-4 text-left">
            <h2 className="text-xl font-semibold mb-2">PocketBase Backend</h2>
            <p>
              Realtime database with authentication and file storage built in.
            </p>
          </div>
          <div className="rounded-lg border p-4 text-left">
            <h2 className="text-xl font-semibold mb-2">TypeScript Support</h2>
            <p>Full type safety across your entire application.</p>
          </div>
        </div>
      </div>

      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center text-sm">
        <div className="flex flex-col items-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PocketNext Starter
          </h1>
          <p className="text-lg text-center max-w-2xl opacity-80">
            The perfect starter for building full-stack applications with
            Next.js and PocketBase
          </p>
        </div>

        {/* Get Started */}
        <div className="flex flex-col items-center mt-12 w-full">
          <h2 className="text-2xl font-bold mb-6">Get Started</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild>
              <Link
                href="https://github.com/yourusername/pocketnext"
                target="_blank"
              >
                GitHub Repository
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                href={`${process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"}/_/`}
                target="_blank"
              >
                PocketBase Admin
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/docs">Documentation</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center opacity-70 text-sm mt-12">
        <p>
          Built with Next.js {process.env.NEXT_VERSION || "15"} and PocketBase{" "}
          {version !== "Loading..." ? version : ""}
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex flex-col h-full p-6 rounded-lg border border-gray-200/20 bg-white/5 hover:bg-white/10 transition">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm opacity-70">{description}</p>
    </div>
  );
}
