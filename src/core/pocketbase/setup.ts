import path from "path";
import fs from "fs-extra";
import ora, { Ora } from "ora";
import chalk from "chalk";
import { execSync } from "child_process";
import { getOnline } from "@/utils";
import { getPocketbaseVersions } from "@/core/pocketbase/versions";

/**
 * Run the PocketBase setup process
 */
export async function runPocketBaseSetup(
  projectPath: string,
  packageManager: string,
  pocketbaseVersion?: string,
  externalSpinner?: Ora
): Promise<void> {
  // Determine the version to use
  let version = pocketbaseVersion;

  // If no version specified, attempt to get stable version
  if (!version) {
    try {
      if (await getOnline()) {
        const versions = await getPocketbaseVersions();
        version = versions.stable;
      }
    } catch (error) {
      // Default version will be used if fetching fails
      version = "0.25.9";
    }
  }

  // Fallback to default if we still don't have a version
  version = version || "0.25.9";

  // Use external spinner if provided, otherwise create our own
  const spinner =
    externalSpinner || ora(`Setting up PocketBase ${version}...`).start();
  if (!externalSpinner) {
    spinner.start();
  } else {
    spinner.text = `Setting up PocketBase ${version}...`;
  }

  try {
    // Create scripts directory if it doesn't exist
    const scriptsDir = path.join(projectPath, "scripts");
    await fs.ensureDir(scriptsDir);

    // Update or create .env file with PB_VERSION
    await updateEnvFile(projectPath, version);

    // Execute the download script
    if (packageManager === "yarn") {
      execSync(`cd ${projectPath} && yarn setup:db`, { stdio: "ignore" });
    } else if (packageManager === "pnpm") {
      execSync(`cd ${projectPath} && pnpm setup:db`, { stdio: "ignore" });
    } else if (packageManager === "bun") {
      execSync(`cd ${projectPath} && bun setup:db`, { stdio: "ignore" });
    } else {
      execSync(`cd ${projectPath} && npm run setup:db`, { stdio: "ignore" });
    }

    // Only succeed if we created our own spinner
    if (!externalSpinner) {
      spinner.succeed(`PocketBase ${version} setup complete`);
    }
  } catch (error) {
    // Only fail if we created our own spinner
    if (!externalSpinner) {
      spinner.fail("Failed to set up PocketBase");
    }
    throw error;
  }
}

/**
 * Update or create .env file with PB_VERSION
 */
async function updateEnvFile(
  projectPath: string,
  pocketbaseVersion: string
): Promise<void> {
  const envPath = path.join(projectPath, ".env");
  const envExamplePath = path.join(projectPath, ".env.example");

  let envContent = "";

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    // Read existing .env
    envContent = await fs.readFile(envPath, "utf8");

    // Update or add PB_VERSION
    if (envContent.includes("PB_VERSION=")) {
      envContent = envContent.replace(
        /PB_VERSION=.*/,
        `PB_VERSION=${pocketbaseVersion}`
      );
    } else {
      envContent += `\nPB_VERSION=${pocketbaseVersion}\n`;
    }
  }
  // Check if .env.example exists to copy from
  else if (fs.existsSync(envExamplePath)) {
    // Copy from .env.example
    envContent = await fs.readFile(envExamplePath, "utf8");

    // Update or add PB_VERSION
    if (envContent.includes("PB_VERSION=")) {
      envContent = envContent.replace(
        /PB_VERSION=.*/,
        `PB_VERSION=${pocketbaseVersion}`
      );
    } else {
      envContent += `\nPB_VERSION=${pocketbaseVersion}\n`;
    }
  }
  // Create basic .env file
  else {
    envContent = `PB_VERSION=${pocketbaseVersion}\n`;
  }

  // Write updated content back to .env
  await fs.writeFile(envPath, envContent, "utf8");
}
