import fs from "fs-extra";
import path from "path";
import os from "os";
import { execa } from "execa";
import got from "got";
import chalk from "chalk";
import type { CreateOptions } from "../types";

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
 * Determines which package manager to use
 */
export async function getPackageManager(
  options: CreateOptions
): Promise<string> {
  if (options.useNpm) return "npm";
  if (options.useYarn) return "yarn";
  if (options.usePnpm) return "pnpm";
  if (options.useBun) return "bun";

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
  --deployment <platform>      Deployment platform: vercel, coolify, standard (default: standard)
  --docker <config>            Docker configuration: standard, coolify, none (default: standard)
  --image-loader <type>        Image loader: vercel, coolify, wsrv (default: vercel)
  --github-workflows           Include GitHub workflow files (default: false)
  --use-npm                    Use npm as package manager
  --use-yarn                   Use yarn as package manager
  --use-pnpm                   Use pnpm as package manager
  --use-bun                    Use bun as package manager (default if available)
  --skip-install               Skip package installation
  -y, --yes                    Skip interactive prompts and use defaults
  --help                       Display this help message

${chalk.bold("Examples:")}
  bunx pocketnext@latest my-app
  bunx pocketnext@latest my-app --use-npm
  bunx pocketnext@latest my-app --deployment vercel --image-loader vercel
  bunx pocketnext@latest my-app --docker coolify --github-workflows -y`);
  process.exit(0);
}

// Export all utility functions
export * from "./cli";
export * from "./fs";
export * from "./template";
export * from "./ui";
