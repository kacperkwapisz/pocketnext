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
    template: "kacperkwapisz/pocketnext",
    deploymentPlatform: "standard",
    dockerConfig: "standard",
    imageLoader: "vercel",
    includeGithubWorkflows: false,
  };

  // Check for -y/--yes flag to enable non-interactive mode
  if (args.includes("-y") || args.includes("--yes")) {
    options.yes = true;
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

  // Check for custom template
  const templateIndex = args.findIndex(
    (arg) => arg === "-t" || arg === "--template"
  );
  if (templateIndex !== -1 && args.length > templateIndex + 1) {
    options.template = args[templateIndex + 1];
  }

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

  return options;
}

/**
 * Extracts the project directory from CLI arguments
 */
export function getProjectPath(args: string[]): string {
  const nonOptionArgs = args.filter((arg) => !arg.startsWith("-"));
  return nonOptionArgs[0] || "my-app";
}
