import Link from "next/link";
import { createClient } from "@/lib/pocketbase/server";

export default async function Home() {
  // Demonstrate PocketBase connection in server component
  const pocketbase = await createClient();
  let connectionStatus = "Connected";
  let version = "Loading...";

  try {
    const healthResponse = await fetch(
      `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/health`,
      { cache: "no-store" }
    );
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      version = data?.data?.version || "Unknown";
    }
  } catch (error) {
    connectionStatus = "Not Connected";
    console.error("Failed to connect to PocketBase", error);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
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

        {/* PocketBase connection status */}
        <div className="mb-12 bg-white/5 p-6 rounded-lg border border-gray-200/20 w-full max-w-2xl">
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
              <span className="font-medium">{version}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 w-full">
          <FeatureCard
            title="Next.js App Router"
            description="Utilizing the latest Next.js features with the App Router architecture"
            icon="🚀"
          />
          <FeatureCard
            title="PocketBase Backend"
            description="Built-in authentication, database, and file storage"
            icon="🔌"
          />
          <FeatureCard
            title="Docker Ready"
            description="Production-ready Docker setup with health checks"
            icon="🐳"
          />
          <FeatureCard
            title="CI/CD Pipeline"
            description="GitHub Actions workflow for continuous deployment"
            icon="🔄"
          />
          <FeatureCard
            title="Tailwind CSS"
            description="Beautiful, utility-first CSS framework"
            icon="🎨"
          />
          <FeatureCard
            title="Coolify Support"
            description="Easy deployment to Coolify hosting"
            icon="☁️"
          />
        </div>

        {/* Get Started */}
        <div className="flex flex-col items-center mb-12 w-full">
          <h2 className="text-2xl font-bold mb-6">Get Started</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="https://github.com/kacperkwapisz/pocketnext"
              target="_blank"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              GitHub Repository
            </Link>
            <Link
              href={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/_/`}
              target="_blank"
              className="px-6 py-3 bg-white/10 rounded-md hover:bg-white/20 transition border border-white/20"
            >
              PocketBase Admin
            </Link>
            <Link
              href="/docs"
              className="px-6 py-3 bg-white/10 rounded-md hover:bg-white/20 transition border border-white/20"
            >
              Documentation
            </Link>
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
