import fs from "fs-extra";
import path from "path";
import os from "os";
import { execa } from "execa";
import got from "got";
import tar from "tar";
import { Stream } from "stream";
import { promisify } from "util";
import type { CreateOptions } from "../types";

const pipeline = promisify(Stream.pipeline);

/**
 * Checks if the user is online
 */
export async function getOnline(): Promise<boolean> {
  try {
    await got("https://registry.npmjs.org/npm");
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets paths for template extraction
 */
export async function getTemplatePaths(): Promise<{
  tempPath: string;
  templatePath: string;
}> {
  const tempPath = path.join(os.tmpdir(), "pocketnext-template");
  const templatePath = path.join(tempPath, "template");

  await fs.ensureDir(tempPath);
  await fs.emptyDir(tempPath);
  await fs.ensureDir(templatePath);

  return { tempPath, templatePath };
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
 * Removes git directory from the template
 */
export async function removeGitFromTemplate(targetPath: string): Promise<void> {
  const gitPath = path.join(targetPath, ".git");
  if (fs.existsSync(gitPath)) {
    await fs.remove(gitPath);
  }
}

interface DownloadOptions {
  repo: string;
  targetPath: string;
  branch?: string;
}

/**
 * Downloads and extracts a GitHub repository
 */
export async function downloadAndExtractRepo({
  repo,
  targetPath,
  branch = "main",
}: DownloadOptions): Promise<void> {
  const url = `https://codeload.github.com/${repo}/tar.gz/${branch}`;

  await pipeline(got.stream(url), tar.extract({ cwd: targetPath, strip: 1 }));
}

// Export all utility functions
export * from "./cli";
export * from "./fs";
export * from "./template";
