import fs from "fs-extra";
import path from "path";
import os from "os";
import { execa } from "execa";
import got from "got";
import chalk from "chalk";
import type { CreateOptions } from "../types";

// Add a declaration for the Bun-specific property
declare global {
  namespace NodeJS {
    interface Process {
      isBun?: boolean;
    }
  }
}

/**
 * Checks if the user is online
 */
export async function getOnline(): Promise<boolean> {
  try {
    // Add a 3-second timeout to prevent hanging on slow connections
    await got("https://registry.npmjs.org/npm", { timeout: { request: 3000 } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Determine which package manager to use
 */
export async function getPackageManager(
  options: CreateOptions
): Promise<string> {
  // Check explicit CLI options first
  if (options.useNpm) return "npm";
  if (options.useYarn) return "yarn";
  if (options.usePnpm) return "pnpm";
  if (options.useBun) return "bun";

  // Check how the script is being executed

  // Check for Bun specifically - Bun-specific checks
  if (typeof process.isBun !== "undefined") return "bun";
  if (process.env.BUN_INSTALL) return "bun";

  // Check the executable that's running this process
  const execPath = process.argv[0];
  if (execPath) {
    const execName = execPath.split("/").pop();
    if (execName === "bun") return "bun";
    if (execName === "pnpm") return "pnpm";
    if (execName === "yarn") return "yarn";
  }

  // Check npm user agent for other package managers
  const userAgent = process.env.npm_config_user_agent;
  if (userAgent) {
    if (userAgent.startsWith("bun")) return "bun";
    if (userAgent.startsWith("pnpm")) return "pnpm";
    if (userAgent.startsWith("yarn")) return "yarn";
    if (userAgent.startsWith("npm")) return "npm";
  }

  // Detect available package managers
  const packageManagers = {
    npm: false,
    yarn: false,
    pnpm: false,
    bun: false,
  };

  try {
    await execa("npm", ["--version"]);
    packageManagers.npm = true;
  } catch {}
  try {
    await execa("yarn", ["--version"]);
    packageManagers.yarn = true;
  } catch {}
  try {
    await execa("pnpm", ["--version"]);
    packageManagers.pnpm = true;
  } catch {}
  try {
    await execa("bun", ["--version"]);
    packageManagers.bun = true;
  } catch {}

  // Prefer bun > pnpm > yarn > npm
  if (packageManagers.bun) return "bun";
  if (packageManagers.pnpm) return "pnpm";
  if (packageManagers.yarn) return "yarn";
  return "npm";
}

/**
 * Displays help message for the CLI
 */
export function displayHelp(): void {
  console.log(`${chalk.bold("Usage:")} pocketnext [options] [project-directory]

Create a new PocketNext project with an interactive setup experience.

${chalk.bold("Options:")}
  -v, --version                Display the version number
  --profile <profile>          Project setup profile: minimal, standard, production, custom
  --quick                      Use sensible defaults with minimal prompts
  --deployment <platform>      Deployment platform: vercel, coolify, standard
  --docker <config>            Docker configuration: standard, coolify, none
  --image-loader <type>        Image loader: vercel, coolify, wsrv
  --github-workflows           Include GitHub workflow files
  --scripts <option>           Scripts handling: keep, runAndKeep, runAndDelete
  --pb-version <version>       PocketBase version to install (format: x.y.z)
  --use-npm                    Use npm as package manager
  --use-yarn                   Use yarn as package manager
  --use-pnpm                   Use pnpm as package manager
  --use-bun                    Use bun as package manager (default if available)
  --skip-install               Skip package installation
  -y, --yes                    Skip interactive prompts and use defaults
  --help                       Display this help message

${chalk.bold("Examples:")}
  bunx pocketnext@latest my-app
  bunx pocketnext@latest my-app --profile=minimal
  bunx pocketnext@latest my-app --profile=production --deployment=coolify
  bunx pocketnext@latest my-app --quick
  bunx pocketnext@latest my-app --scripts runAndDelete --pb-version 0.25.9`);
  process.exit(0);
}

// Re-export utility functions
export {
  safeRemove,
  ensureDirectory,
  copyDirectory,
  executeCommand,
  pathExists,
  updatePackageJson,
} from "./fs";

// Export all utility functions
export * from "./cli";
export * from "./fs";
export * from "./template";
export * from "./ui";
