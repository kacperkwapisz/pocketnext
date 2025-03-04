#!/usr/bin/env node

// Don't include shebang here, it's added by tsup

import chalk from "chalk";
import { createProject } from "@/core/create-project";
import { parseCliOptions, getProjectPath } from "@/utils/cli";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";
import validateNpmName from "validate-npm-package-name";
import path from "path";
import { displayHelp, getPackageManager } from "@/utils";
import {
  createHeader,
  createGradient,
  promptUser,
  logSection,
  logCommand,
  pocketNextGradient,
} from "@/utils/ui";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package version - more robust path resolution for production and development
let packageJsonPath;
try {
  // First try relative to dist
  packageJsonPath = resolve(__dirname, "../package.json");
  if (!readFileSync(packageJsonPath, "utf8")) {
    throw new Error("Not found");
  }
} catch (error) {
  try {
    // Then try relative to src (development mode)
    packageJsonPath = resolve(__dirname, "../../package.json");
    if (!readFileSync(packageJsonPath, "utf8")) {
      throw new Error("Not found");
    }
  } catch (error) {
    // Fallback - try to find package.json in parent dirs
    let currentDir = __dirname;
    while (currentDir !== "/") {
      try {
        packageJsonPath = resolve(currentDir, "package.json");
        readFileSync(packageJsonPath, "utf8");
        break;
      } catch (error) {
        currentDir = dirname(currentDir);
      }
    }
  }
}

// If we still don't have a package.json, use a hardcoded version
let version = "0.7.9"; // Fallback version
try {
  if (packageJsonPath) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    version = packageJson.version;
  }
} catch (error) {
  console.error("Warning: Could not read package version, using fallback");
}

/**
 * Validates the project name
 */
function validateProjectName(name: string): {
  valid: boolean;
  problems?: string[];
} {
  const validation = validateNpmName(name);

  if (validation.validForNewPackages) {
    return { valid: true };
  }

  return {
    valid: false,
    problems: [...(validation.errors || []), ...(validation.warnings || [])],
  };
}

/**
 * Handles graceful exit when the process is interrupted
 */
function handleSigInt() {
  process.exit(0);
}

async function getProjectPathFromUser(defaultPath: string): Promise<string> {
  try {
    // Pass the default path to promptUser - pressing Enter should return this value
    const projectPath = await promptUser(
      "Where would you like to create your PocketNext project?",
      defaultPath
    );

    // If user pressed Enter with no input, the default will be used
    // A valid result should never be empty at this point
    if (!projectPath || projectPath.trim() === "") {
      return defaultPath;
    }

    // Validate the project name
    const validation = validateProjectName(path.basename(projectPath));
    if (!validation.valid) {
      console.error(
        chalk.red(
          `Invalid project name: ${validation.problems?.[0] || "Unknown error"}`
        )
      );
      process.exit(1);
    }

    return projectPath;
  } catch (error) {
    // Check if this was a SIGINT rejection
    if (error instanceof Error && error.message === "SIGINT") {
      process.exit(0);
    } else {
      console.error(chalk.red("Error during prompt:"), error);
      process.exit(1);
    }
    // This will never be reached due to process.exit()
    return defaultPath;
  }
}

async function run() {
  // Set up Ctrl+C handler
  process.on("SIGINT", handleSigInt);
  process.on("SIGTERM", handleSigInt);

  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes("--help") || args.includes("-h")) {
    displayHelp();
  }

  // Check for version flag
  if (args.includes("--version") || args.includes("-v")) {
    console.log(version);
    process.exit(0);
  }

  try {
    // Remove @latest from arguments if present (for compatibility)
    const cleanedArgs = args.filter((arg) => arg !== "@latest");

    // Parse options from command line
    const options = parseCliOptions(cleanedArgs);

    // Get project path from arguments or prompt for it
    let projectPath = getProjectPath(cleanedArgs);

    // Check if a path argument was explicitly provided (not inferred from defaults)
    // We need to check if there are positional args, not just any args
    const positionalArgs = cleanedArgs.filter((arg) => !arg.startsWith("-"));
    const hasProvidedPath = positionalArgs.length > 0;

    if (!hasProvidedPath && !options.yes) {
      projectPath = await getProjectPathFromUser("my-app");
    }

    // Get package manager
    const packageManager = await getPackageManager(options);

    // Store the package manager in options to ensure consistency
    options.packageManager = packageManager;

    // Debug - remove after testing
    if (process.env.DEBUG) {
      console.log("Detected package manager:", packageManager);
      console.log("Executable path:", process.argv[0]);
    }

    // Run create with options
    try {
      await createProject(projectPath, options);

      // Display success message
      console.log();
      console.log(
        pocketNextGradient(">>> Success!") +
          " Created your PocketNext project at " +
          chalk.green(projectPath)
      );
      console.log();

      // Application section
      console.log(chalk.cyan("Your project includes:"));

      console.log(chalk.bold("• Next.js 15 with App Router"));
      console.log(chalk.bold("• PocketBase backend"));
      console.log(chalk.bold("• TypeScript, TailwindCSS, ESLint"));

      // Add monorepo-specific messaging if monorepo template was used
      if (options.template === "monorepo") {
        console.log(chalk.bold("• Monorepo structure with Turborepo"));
        console.log(chalk.bold("• Shared UI components package"));
      }

      console.log();

      // Getting started instructions with numbered steps
      console.log(chalk.bold("To get started:"));
      console.log(
        chalk.cyan(`1.`) +
          ` Change to the project directory:\n   ${chalk.cyan(`cd ${projectPath}`)}`
      );
      console.log();

      // Use the packageManager from options (which was detected earlier)
      const runCmd = options.packageManager === "npm" ? "run " : "";

      console.log(
        chalk.cyan(`2.`) +
          ` Start the development server:\n   ${chalk.cyan(`${options.packageManager} ${runCmd}dev`)}`
      );

      console.log();
      console.log(chalk.bold("Additional commands:"));

      // List additional commands in a cleaner format
      console.log(
        `  ${chalk.cyan(`${options.packageManager} ${runCmd}build`)} - Builds the application`
      );
      if (options.dockerConfig === "standard") {
        console.log(
          `  ${chalk.cyan(`docker compose up -d`)} - Start in Docker`
        );
      }

      console.log();
      console.log(chalk.bold("Once running, visit:"));
      console.log(`  ${chalk.cyan(`http://localhost:3000`)} - Frontend`);
      console.log(
        `  ${chalk.cyan(`http://localhost:8090/_/`)} - PocketBase Admin`
      );
      console.log();
    } catch (error) {
      console.error(chalk.red("Failed to create project:"), error);
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red("Error:"), error);
    process.exit(1);
  } finally {
    // Clean up SIGINT handlers
    process.off("SIGINT", handleSigInt);
    process.off("SIGTERM", handleSigInt);
  }
}

// Run the CLI
run();
