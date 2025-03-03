import got from "got";
import chalk from "chalk";
import prompts from "prompts";
import { getOnline } from "@/utils";

// Cache for version information with timestamp
interface VersionCache {
  latest?: string;
  stable?: string;
  timestamp?: number;
}

// Cache expiry time (5 minutes)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

// Cache object to store versions
let pocketbaseVersionCache: VersionCache = {};

/**
 * Get the latest PocketBase version from GitHub
 */
export async function getLatestPocketbaseVersion(): Promise<string> {
  try {
    const versions = await getPocketbaseVersions();
    return versions.latest;
  } catch (error) {
    console.warn(
      chalk.yellow("Failed to fetch latest PocketBase version. Using default.")
    );
    return "0.25.9"; // Default fallback version
  }
}

/**
 * Get the stable PocketBase version (second most recent release)
 */
export async function getStablePocketbaseVersion(): Promise<string> {
  try {
    const versions = await getPocketbaseVersions();
    return versions.stable;
  } catch (error) {
    console.warn(
      chalk.yellow("Failed to fetch stable PocketBase version. Using default.")
    );
    return "0.25.9"; // Default fallback version
  }
}

/**
 * Get both latest and stable PocketBase versions
 * Uses caching to avoid frequent API calls
 */
export async function getPocketbaseVersions(): Promise<{
  latest: string;
  stable: string;
}> {
  // Check if cache is valid (not expired and has values)
  const now = Date.now();
  if (
    pocketbaseVersionCache.timestamp &&
    now - pocketbaseVersionCache.timestamp < CACHE_EXPIRY_MS &&
    pocketbaseVersionCache.latest &&
    pocketbaseVersionCache.stable
  ) {
    return {
      latest: pocketbaseVersionCache.latest,
      stable: pocketbaseVersionCache.stable,
    };
  }

  // Cache is expired or empty, fetch fresh versions
  try {
    if (!(await getOnline())) {
      throw new Error("No internet connection");
    }

    // Fetch releases from GitHub
    const [latest, allReleases] = await Promise.all([
      fetchLatestVersion(),
      fetchAllReleases(),
    ]);

    // Get stable version (second most recent non-beta release)
    const stableVersion = findStableVersion(allReleases, latest);

    // Update cache with new values and timestamp
    pocketbaseVersionCache = {
      latest,
      stable: stableVersion,
      timestamp: Date.now(),
    };

    return {
      latest,
      stable: stableVersion,
    };
  } catch (error) {
    // If error, use default values
    return {
      latest: "0.25.9",
      stable: "0.25.9",
    };
  }
}

/**
 * Prompt the user to select a PocketBase version
 */
export async function promptForPocketBaseVersion(): Promise<
  string | undefined
> {
  let choices = [];
  let defaultVersion = "0.25.9";
  let hasOnline = false;

  // Cancellation handler
  const promptsOptions = {
    onCancel: () => {
      console.log(chalk.yellow("\nOperation canceled by user. Exiting..."));
      process.exit(0);
    },
  };

  try {
    hasOnline = await getOnline();
    if (hasOnline) {
      const versions = await getPocketbaseVersions();
      defaultVersion = versions.stable;

      choices = [
        {
          title: `Latest (${versions.latest})`,
          description: "Most recent release from GitHub",
          value: versions.latest,
        },
        {
          title: `Stable (${versions.stable})`,
          description: "Recommended for production",
          value: versions.stable,
        },
        {
          title: "Custom version",
          description: "Specify a particular version",
          value: "custom",
        },
      ];
    } else {
      choices = [
        {
          title: `Default (${defaultVersion})`,
          description: "Fallback version (no internet connection)",
          value: defaultVersion,
        },
        {
          title: "Custom version",
          description: "Specify a particular version",
          value: "custom",
        },
      ];
    }
  } catch (error) {
    // Fallback for any errors
    choices = [
      {
        title: `Default (${defaultVersion})`,
        description: "Fallback version",
        value: defaultVersion,
      },
      {
        title: "Custom version",
        description: "Specify a particular version",
        value: "custom",
      },
    ];
  }

  // Prompt user to select version
  const versionResponse = await prompts(
    {
      type: "select",
      name: "version",
      message: "PocketBase version:",
      choices,
    },
    promptsOptions
  );

  const selectedVersion = versionResponse.version;

  // Handle custom version input
  if (selectedVersion === "custom") {
    const customResponse = await prompts(
      {
        type: "text",
        name: "version",
        message: "Custom PocketBase version (x.y.z):",
        validate: (input) =>
          /^\d+\.\d+\.\d+$/.test(input) || "Format required: x.y.z",
      },
      promptsOptions
    );

    return customResponse.version;
  }

  return selectedVersion;
}

// Helper functions

async function fetchLatestVersion(): Promise<string> {
  const response = await got
    .get("https://api.github.com/repos/pocketbase/pocketbase/releases/latest", {
      headers: {
        "User-Agent": "PocketNext-CLI",
      },
    })
    .json();

  if (typeof response !== "object" || response === null) {
    throw new Error("Invalid response from GitHub API");
  }

  // Access properties with type checking
  const dataObj = response as any;
  if (typeof dataObj.tag_name !== "string") {
    throw new Error("Invalid tag_name in GitHub API response");
  }

  return dataObj.tag_name.replace(/^v/, "");
}

async function fetchAllReleases(): Promise<string[]> {
  const response = await got
    .get(
      "https://api.github.com/repos/pocketbase/pocketbase/releases?per_page=5",
      {
        headers: {
          "User-Agent": "PocketNext-CLI",
        },
      }
    )
    .json();

  if (!Array.isArray(response)) {
    throw new Error("Invalid response from GitHub API");
  }

  return response
    .filter(
      (release: any) =>
        typeof release === "object" &&
        release !== null &&
        typeof release.tag_name === "string" &&
        !release.prerelease
    )
    .map((release: any) => release.tag_name.replace(/^v/, ""));
}

function findStableVersion(versions: string[], latestVersion: string): string {
  // If only one version or no versions, return latest
  if (versions.length <= 1) {
    return latestVersion;
  }

  // Otherwise, return the second most recent release
  return versions[1];
}
