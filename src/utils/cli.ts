import chalk from "chalk";
import type { CreateOptions } from "../types";

/**
 * Validates and normalizes a value against allowed options
 */
function validateOption(
  value: string,
  allowedValues: string[],
  defaultValue: string,
  optionName: string
): string {
  if (!allowedValues.includes(value)) {
    console.warn(
      chalk.yellow(
        `Warning: Invalid ${optionName} "${value}". Using "${defaultValue}" instead.`
      )
    );
    return defaultValue;
  }
  return value;
}

/**
 * Parses CLI arguments into a CreateOptions object
 */
export function parseCliOptions(args: string[]): CreateOptions {
  // Set defaults
  const options: CreateOptions = {
    yes: false, // Default to interactive mode
    deploymentPlatform: "standard",
    dockerConfig: "standard",
    imageLoader: "vercel",
    includeGithubWorkflows: false,
    scriptsHandling: "keep", // Default to keeping scripts
    template: "default", // Default template
  };

  // Check for -y/--yes flag to enable non-interactive mode
  if (args.includes("-y") || args.includes("--yes")) {
    options.yes = true;
  }

  // Check for template option
  const templateIndex = args.findIndex((arg) => arg === "--template");
  if (templateIndex !== -1 && args.length > templateIndex + 1) {
    const value = args[templateIndex + 1];
    options.template = validateOption(
      value,
      ["default", "monorepo"],
      "default",
      "template"
    );
  }

  // Check for --quick flag to enable simplified setup with minimal prompts
  if (args.includes("--quick")) {
    options.quick = true;
    // Quick mode sets "standard" profile by default, but still allows customization
    if (!args.includes("--profile")) {
      options.profile = "standard";
    }
  }

  // Check for package manager flags
  if (args.includes("--use-npm")) options.useNpm = true;
  if (args.includes("--use-yarn")) options.useYarn = true;
  if (args.includes("--use-pnpm")) options.usePnpm = true;
  if (args.includes("--use-bun")) options.useBun = true;

  // Check for skip-install flag
  if (args.includes("--skip-install")) options.skipInstall = true;

  // Check for github-workflows flag
  if (args.includes("--github-workflows"))
    options.includeGithubWorkflows = true;

  // Check for deployment platform
  const deploymentIndex = args.findIndex((arg) => arg === "--deployment");
  if (deploymentIndex !== -1 && args.length > deploymentIndex + 1) {
    const value = args[deploymentIndex + 1];
    options.deploymentPlatform = validateOption(
      value,
      ["vercel", "coolify", "standard"],
      "standard",
      "deployment platform"
    );
  }

  // Check for docker configuration
  const dockerIndex = args.findIndex((arg) => arg === "--docker");
  if (dockerIndex !== -1 && args.length > dockerIndex + 1) {
    const value = args[dockerIndex + 1];
    options.dockerConfig = validateOption(
      value,
      ["standard", "coolify", "none"],
      "standard",
      "docker configuration"
    );
  }

  // Check for image loader
  const loaderIndex = args.findIndex((arg) => arg === "--image-loader");
  if (loaderIndex !== -1 && args.length > loaderIndex + 1) {
    const value = args[loaderIndex + 1];
    options.imageLoader = validateOption(
      value,
      ["vercel", "coolify", "wsrv"],
      "vercel",
      "image loader"
    );
  }

  // Check for scripts handling
  const scriptsIndex = args.findIndex((arg) => arg === "--scripts");
  if (scriptsIndex !== -1 && args.length > scriptsIndex + 1) {
    const value = args[scriptsIndex + 1];
    options.scriptsHandling = validateOption(
      value,
      ["keep", "runAndKeep", "runAndDelete"],
      "keep",
      "scripts handling"
    ) as "keep" | "runAndKeep" | "runAndDelete";
  }

  // Check for PocketBase version
  const versionIndex = args.findIndex((arg) => arg === "--pb-version");
  if (versionIndex !== -1 && args.length > versionIndex + 1) {
    // Validate semver format with a simple regex (major.minor.patch)
    const value = args[versionIndex + 1];
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (semverRegex.test(value)) {
      options.pocketbaseVersion = value;
    } else {
      console.warn(
        chalk.yellow(
          `Warning: Invalid PocketBase version format "${value}". Must be in format x.y.z. Using default version instead.`
        )
      );
    }
  }

  // Check for profile
  const profileIndex = args.findIndex(
    (arg) => arg === "--profile" || arg.startsWith("--profile=")
  );
  if (profileIndex !== -1) {
    let value;
    if (args[profileIndex].includes("=")) {
      // Handle --profile=value format
      value = args[profileIndex].split("=")[1];
    } else if (args.length > profileIndex + 1) {
      // Handle --profile value format
      value = args[profileIndex + 1];
    }

    if (value) {
      options.profile = validateOption(
        value,
        ["minimal", "standard", "production", "custom"],
        "standard",
        "project profile"
      );
    }
  }

  return options;
}

/**
 * Extracts the project directory from CLI arguments
 */
export function getProjectPath(args: string[]): string {
  const nonOptionArgs = args.filter((arg) => !arg.startsWith("-"));
  return nonOptionArgs[0] || "my-app";
}
