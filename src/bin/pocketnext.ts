#!/usr/bin/env node

// Don't include shebang here, it's added by tsup

import chalk from "chalk";
import { createProject } from "../core/create-project";
import { parseCliOptions, getProjectPath } from "../utils/cli";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";
import prompts from "prompts";
import validateNpmName from "validate-npm-package-name";
import path from "path";
import readline from "readline";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package version
const packageJsonPath = resolve(__dirname, "../../package.json");
const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8"));

/**
 * Displays help message for the CLI
 */
function displayHelp(): void {
  console.log(`
${chalk.bold("pocketnext")} [options] [project-directory]

Create a new PocketNext project with an interactive setup experience.

${chalk.bold("Options:")}
  -t, --template <name>        Specify a template (default: "kacperkwapisz/pocketnext")
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
  bunx pocketnext@latest my-app --docker coolify --github-workflows -y
  bunx pocketnext@latest my-app -t kacperkwapisz/pocketnext
  `);
  process.exit(0);
}

// Display welcome banner
function displayBanner() {
  console.log(
    chalk.blue(`
██████╗  ██████╗  ██████╗██╗  ██╗███████╗████████╗███╗   ██╗███████╗██╗  ██╗████████╗
██╔══██╗██╔═══██╗██╔════╝██║ ██╔╝██╔════╝╚══██╔══╝████╗  ██║██╔════╝╚██╗██╔╝╚══██╔══╝
██████╔╝██║   ██║██║     █████╔╝ █████╗     ██║   ██╔██╗ ██║█████╗   ╚███╔╝    ██║   
██╔═══╝ ██║   ██║██║     ██╔═██╗ ██╔══╝     ██║   ██║╚██╗██║██╔══╝   ██╔██╗    ██║   
██║     ╚██████╔╝╚██████╗██║  ██╗███████╗   ██║   ██║ ╚████║███████╗██╔╝ ██╗   ██║   
╚═╝      ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝   ╚═╝   
`)
  );
  console.log(chalk.blue(`v${version} - Next.js + PocketBase Starter`));
  console.log();
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
  console.log();
  console.log(chalk.red("Process interrupted. Exiting..."));
  process.exit(0);
}

async function getProjectPathFromUser(defaultPath: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`What is your project named? (${defaultPath}) `, (answer) => {
      rl.close();
      const projectPath = answer.trim() || defaultPath;

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

      resolve(projectPath);
    });

    // Handle Ctrl+C during the readline prompt
    rl.on("SIGINT", () => {
      rl.close();
      handleSigInt();
    });
  });
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

  // Display banner
  displayBanner();

  // Display welcome message
  console.log(
    `${chalk.blue("Welcome to")} ${chalk.bold.blue("PocketNext")} - ${chalk.blue("Create full-stack Next.js + PocketBase projects")}`
  );
  console.log();

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
    try {
      projectPath = await getProjectPathFromUser("my-app");
    } catch (error) {
      console.error(chalk.red("Error during prompt:"), error);
      handleSigInt();
      return;
    }
  }

  if (options.template !== "kacperkwapisz/pocketnext") {
    console.log(chalk.blue(`Using template: ${options.template}`));
  }
  console.log();

  // Run create with options
  try {
    await createProject(projectPath, options);
  } catch (error) {
    console.error(chalk.red("Failed to create project:"), error);
    process.exit(1);
  }
}

// Run the CLI
run();
