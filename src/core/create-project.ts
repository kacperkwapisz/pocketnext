import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { execa } from "execa";
import { fileURLToPath } from "url";
import got from "got";
import os from "os";
import tar from "tar";
import { glob } from "glob";
import type { CreateOptions, Feature, FeatureCategory } from "../types";
import { getPackageManager, getOnline, safeRemove } from "../utils";

// Template repository details
const REPO_OWNER = "kacperkwapisz";
const REPO_NAME = "pocketnext";
const BRANCH = "main"; // or any other branch

/**
 * Available feature categories that can be selected during project creation
 */
export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "deployment",
    name: "Deployment Platform",
    description: "Choose your deployment platform configuration",
    exclusive: true,
    options: [
      {
        id: "vercel",
        name: "Vercel",
        description: "Configure for Vercel deployment",
      },
      {
        id: "coolify",
        name: "Coolify",
        description: "Configure for Coolify deployment",
      },
      {
        id: "standard",
        name: "Standard",
        description: "No specific deployment configuration",
      },
    ],
  },
  {
    id: "docker",
    name: "Docker Configuration",
    description: "Choose your Docker setup",
    exclusive: true,
    options: [
      {
        id: "standard",
        name: "Standard",
        description: "Standard Docker setup",
      },
      {
        id: "coolify",
        name: "Coolify",
        description: "Docker setup optimized for Coolify",
      },
      {
        id: "none",
        name: "None",
        description: "No Docker configuration",
      },
    ],
  },
  {
    id: "imageLoader",
    name: "Image Loader",
    description: "Choose your image loading solution",
    exclusive: true,
    options: [
      {
        id: "vercel",
        name: "Vercel Image Loader",
        description: "Use Vercel's built-in image optimization",
      },
      {
        id: "coolify",
        name: "Coolify Image Loader",
        description: "Use Coolify for image optimization",
      },
      {
        id: "wsrv",
        name: "WSRV Image Loader",
        description: "Use WSRV.nl for image optimization",
      },
    ],
  },
  {
    id: "workflows",
    name: "GitHub Workflows",
    description: "GitHub Actions workflow configuration",
    exclusive: true,
    options: [
      {
        id: "include",
        name: "Include GitHub Workflows",
        description: "Add GitHub Actions workflows for CI/CD",
      },
      {
        id: "exclude",
        name: "Exclude GitHub Workflows",
        description: "Don't include GitHub Actions workflows",
      },
    ],
  },
];

/**
 * Copy GitHub workflow files to the target directory or create default ones if not available
 */
async function setupGitHubWorkflows(targetDir: string): Promise<void> {
  const workflowsDir = path.join(targetDir, ".github", "workflows");
  await fs.ensureDir(workflowsDir);

  let copied = false;

  // Try multiple possible template locations
  const possibleTemplatePaths = [
    // Standard path when running from source
    path.join(process.cwd(), "templates", "default", ".github", "workflows"),
    // Path when templates are in dist
    path.join(
      process.cwd(),
      "dist",
      "templates",
      "default",
      ".github",
      "workflows"
    ),
    // Path for fetched GitHub templates
    path.join(
      os.tmpdir(),
      `pocketnext-template-*/${REPO_NAME}-${BRANCH}/templates/default/.github/workflows`
    ),
    // Path relative to the target project
    path.join(targetDir, "..", "templates", "default", ".github", "workflows"),
  ];

  // Try each possible path
  for (const templatePathPattern of possibleTemplatePaths) {
    try {
      // Handle glob patterns for temp directories
      let templatePaths = [templatePathPattern];
      if (templatePathPattern.includes("*")) {
        // Find matching directories using glob
        const matches = await glob(templatePathPattern);
        if (matches.length > 0) {
          templatePaths = matches;
        }
      }

      // Try each path
      for (const templatePath of templatePaths) {
        if (await fs.pathExists(templatePath)) {
          const files = await fs.readdir(templatePath);
          if (files.length > 0) {
            // Copy files
            for (const file of files) {
              const sourcePath = path.join(templatePath, file);
              const destPath = path.join(workflowsDir, file);
              await fs.copy(sourcePath, destPath, { overwrite: true });
              copied = true;
            }

            if (copied) {
              // Success! Stop looking for templates
              break;
            }
          }
        }
      }

      if (copied) {
        // If files were copied, no need to try other paths
        break;
      }
    } catch (error) {
      // Continue to the next path if this one fails
      continue;
    }
  }

  // If no files were copied, create a default CI workflow
  if (!copied) {
    const ciWorkflowContent = `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Build
        run: npm run build
`;
    await fs.writeFile(path.join(workflowsDir, "ci.yml"), ciWorkflowContent);
  }
}

/**
 * Available features that can be selected during project creation
 */
export const AVAILABLE_FEATURES: Record<string, Feature> = {
  githubActions: {
    name: "GitHub Workflows",
    description: "Add GitHub Actions workflows for CI/CD",
    dependencies: [],
    setup: setupGitHubWorkflows,
  },
  // Add more features as needed
};

/**
 * Detects which package managers are available in the environment
 */
export async function detectPackageManagers(): Promise<
  Record<string, boolean>
> {
  const packageManagers = {
    npm: false,
    yarn: false,
    pnpm: false,
    bun: false,
  };

  try {
    await execa("npm", ["--version"]);
    packageManagers.npm = true;
  } catch (e) {}

  try {
    await execa("yarn", ["--version"]);
    packageManagers.yarn = true;
  } catch (e) {}

  try {
    await execa("pnpm", ["--version"]);
    packageManagers.pnpm = true;
  } catch (e) {}

  try {
    await execa("bun", ["--version"]);
    packageManagers.bun = true;
  } catch (e) {}

  return packageManagers;
}

/**
 * Handles removing unselected feature-specific files from the target directory
 * and setting up selected features
 */
async function applyFeatures(
  targetDir: string,
  selections: Record<string, string | boolean>
): Promise<void> {
  // First, set up selected features
  const spinner = ora("Setting up selected features...").start();
  try {
    // Set up GitHub Workflows if selected
    if (selections.includeGithubWorkflows) {
      spinner.text = "Setting up GitHub workflows...";
      await AVAILABLE_FEATURES.githubActions.setup(targetDir);
      spinner.succeed("GitHub workflows set up successfully");
    } else {
      // If not selected, remove the .github directory
      await safeRemove(path.join(targetDir, ".github"));
    }

    // Handle deployment platform
    spinner.text = "Configuring deployment platform...";
    if (selections.deploymentPlatform !== "vercel") {
      await safeRemove(path.join(targetDir, "vercel.json"));
    }

    if (selections.deploymentPlatform !== "coolify") {
      await safeRemove(path.join(targetDir, "docker-compose.coolify.yml"));
    }

    // Handle Docker configuration
    spinner.text = "Configuring Docker...";
    if (selections.dockerConfig === "none") {
      // Remove all Docker files if Docker is not selected
      await safeRemove(path.join(targetDir, "docker-compose.yml"));
      await safeRemove(path.join(targetDir, "docker-compose.coolify.yml"));
      await safeRemove(path.join(targetDir, "Dockerfile.nextjs"));
      await safeRemove(path.join(targetDir, "Dockerfile.pocketbase"));
      await safeRemove(path.join(targetDir, ".dockerignore"));
    } else if (selections.dockerConfig === "standard") {
      // Remove Coolify-specific Docker files
      await safeRemove(path.join(targetDir, "docker-compose.coolify.yml"));
    } else if (selections.dockerConfig === "coolify") {
      // Rename Coolify docker-compose file to be the default
      const coolifyDockerPath = path.join(
        targetDir,
        "docker-compose.coolify.yml"
      );
      const standardDockerPath = path.join(targetDir, "docker-compose.yml");

      if (await fs.pathExists(coolifyDockerPath)) {
        // Remove standard docker-compose if it exists
        await safeRemove(standardDockerPath);
        // Rename coolify to standard
        await fs.rename(coolifyDockerPath, standardDockerPath);
      }
    }

    // Handle image loader
    spinner.text = "Configuring image loader...";
    // First, copy the selected loader to loader.ts
    const loaderPath = path.join(targetDir, "loader.ts");
    const nextConfigPath = path.join(targetDir, "next.config.ts");

    if (selections.imageLoader === "coolify") {
      const coolifyLoaderPath = path.join(targetDir, "loader-coolify.ts");
      if (await fs.pathExists(coolifyLoaderPath)) {
        await fs.copy(coolifyLoaderPath, loaderPath, { overwrite: true });

        // Update next.config.ts to use the custom loader
        if (await fs.pathExists(nextConfigPath)) {
          let config = await fs.readFile(nextConfigPath, "utf8");
          config = config.replace(
            /loaderFile: ['"].*?['"]/,
            `loaderFile: './loader.ts'`
          );
          await fs.writeFile(nextConfigPath, config);
        }
      }
    } else if (selections.imageLoader === "wsrv") {
      const wsrvLoaderPath = path.join(targetDir, "loader-wsrv.ts");
      if (await fs.pathExists(wsrvLoaderPath)) {
        await fs.copy(wsrvLoaderPath, loaderPath, { overwrite: true });

        // Update next.config.ts to use the custom loader
        if (await fs.pathExists(nextConfigPath)) {
          let config = await fs.readFile(nextConfigPath, "utf8");
          config = config.replace(
            /loaderFile: ['"].*?['"]/,
            `loaderFile: './loader.ts'`
          );
          await fs.writeFile(nextConfigPath, config);
        }
      }
    } else if (selections.imageLoader === "vercel") {
      // For Vercel, don't create a loader file and update next.config.ts to remove custom loader
      if (await fs.pathExists(nextConfigPath)) {
        let config = await fs.readFile(nextConfigPath, "utf8");

        // Remove the custom loader configuration by removing the entire images section or
        // replacing it with an empty images object
        config = config.replace(
          /images:\s*{\s*loader:\s*['"]custom['"],\s*loaderFile:.*?},/s,
          `images: {},`
        );

        await fs.writeFile(nextConfigPath, config);
      }
    }

    // Remove all the original loader files
    await safeRemove(path.join(targetDir, "loader-coolify.ts"));
    await safeRemove(path.join(targetDir, "loader-wsrv.ts"));

    // If using Vercel, also remove loader.ts if it exists
    if (selections.imageLoader === "vercel") {
      await safeRemove(loaderPath);
    }

    spinner.succeed("Features configured successfully");
  } catch (error) {
    spinner.fail(`Failed to configure features: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Fetches template files from GitHub if local templates aren't available
 */
async function fetchTemplatesFromGitHub(targetDir: string): Promise<string> {
  // Create a temporary directory
  const tempDir = path.join(os.tmpdir(), `pocketnext-template-${Date.now()}`);
  await fs.ensureDir(tempDir);

  const spinner = ora("Downloading template files from GitHub...").start();

  try {
    // Download the repository archive
    const url = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${BRANCH}.tar.gz`;
    const tarballPath = path.join(tempDir, "repo.tar.gz");

    // Use got to download the tarball
    const buffer = await got(url).buffer();
    await fs.writeFile(tarballPath, buffer);

    // Extract only the templates directory
    await tar.extract({
      file: tarballPath,
      cwd: tempDir,
      filter: (path) => path.includes("templates/default"),
    });

    // Find the extracted templates directory
    const extractedDir = path.join(tempDir, `${REPO_NAME}-${BRANCH}`);
    const templatesDir = path.join(extractedDir, "templates/default");

    spinner.succeed("Templates downloaded successfully from GitHub");
    return templatesDir;
  } catch (error) {
    spinner.fail("Failed to download templates from GitHub");
    console.error(error);
    throw new Error("Failed to fetch template files from GitHub");
  }
}

/**
 * Main function to create a new PocketNext project
 */
export async function createProject(
  directory: string,
  options: CreateOptions = {}
): Promise<void> {
  // Allow directory to be undefined/null when called from @latest command
  const targetDir = directory || "my-app";

  // Resolve target directory
  const resolvedPath = path.resolve(targetDir);
  const projectName = path.basename(resolvedPath);

  // Variables to track feature selections
  const featureSelections: Record<string, string | boolean> = {
    deploymentPlatform: options.deploymentPlatform || "standard", // Default value
    dockerConfig: options.dockerConfig || "standard", // Default value
    imageLoader: options.imageLoader || "vercel", // Default value
    includeGithubWorkflows: options.includeGithubWorkflows ?? false, // Default value
  };

  // Set up cleanup function for interruptions
  let createdDirectory = false;
  const cleanup = async () => {
    if (createdDirectory) {
      console.log();
      console.log(chalk.yellow(`Cleaning up ${resolvedPath}...`));
      try {
        await fs.remove(resolvedPath);
        console.log(chalk.green(`Successfully cleaned up ${resolvedPath}`));
      } catch (error) {
        console.error(chalk.red(`Failed to clean up ${resolvedPath}`));
      }
    }
  };

  // Set up SIGINT handler to properly clean up and exit
  const handleSigInt = async () => {
    await cleanup();
    process.exit(0);
  };

  // Register the handler
  process.on("SIGINT", handleSigInt);
  process.on("SIGTERM", handleSigInt);

  try {
    // Check if directory exists and is empty
    if (fs.existsSync(resolvedPath)) {
      const contents = fs.readdirSync(resolvedPath);
      if (contents.length > 0) {
        if (!options.yes) {
          const { proceed } = await prompts({
            type: "confirm",
            name: "proceed",
            message: `Directory "${directory}" already exists and is not empty. Continue?`,
            initial: false,
            onCancel: () => {
              // Don't call handleSigInt directly
              // Just return false to indicate cancellation
              return false;
            },
          });

          // Check if we got a response - if proceed is undefined, it was cancelled
          if (proceed === undefined) {
            await cleanup();
            process.exit(0);
          }

          // If user selected no (either by pressing N or Enter as initial is false)
          if (!proceed) {
            return;
          }
        }
      }
    } else {
      // Create directory if it doesn't exist
      fs.ensureDirSync(resolvedPath);
      createdDirectory = true;
    }

    // Check for network connectivity
    const online = await getOnline();
    if (!online) {
      console.log(chalk.yellow("You appear to be offline. Setup may fail."));
    }

    // Get package manager
    const packageManager =
      options.packageManager || (await getPackageManager(options));

    // Store back in options for consistency
    if (!options.packageManager) {
      options.packageManager = packageManager;
    }

    // If options.yes is true, use defaults without prompting
    if (!options.yes) {
      // Prompt for feature selections if not using --yes flag
      for (const category of FEATURE_CATEGORIES) {
        try {
          const response = await prompts(
            {
              type: "select",
              name: "selection",
              message: category.name,
              hint: category.description,
              choices: category.options.map((option) => ({
                title: option.name,
                description: option.description,
                value: option.id,
              })),
              initial: 0,
            },
            {
              onCancel: () => {
                // Don't call handleSigInt directly
                // Just return false to indicate cancellation
                return false;
              },
            }
          );

          // Check if we got a response - if nothing was returned, it was cancelled
          if (response === undefined || response.selection === undefined) {
            await cleanup();
            process.exit(0);
          }

          const selection = response.selection;

          if (category.id === "workflows") {
            featureSelections.includeGithubWorkflows = selection === "include";
          } else {
            featureSelections[category.id] = selection;
          }
        } catch (error) {
          console.log(`Error during ${category.name} selection: ${error}`);
          // Use default value if there's an error
          if (category.id === "workflows") {
            featureSelections.includeGithubWorkflows = false;
          } else {
            // Use the first option as default
            featureSelections[category.id] = category.options[0].id;
          }
        }
      }
    }

    // Now that we have all user selections, find and copy the template
    // Try to resolve template path in various ways for robustness
    let templateDir;
    let foundLocally = false;

    // First, try to find templates locally
    try {
      // First try using import.meta.url (ESM approach)
      templateDir = path.resolve(
        fileURLToPath(import.meta.url),
        "../../../templates/default"
      );

      // Check if the directory exists
      if (fs.existsSync(templateDir)) {
        foundLocally = true;
      } else {
        // Try from package root (when installed via npm/bun)
        const packageDir = path.resolve(
          fileURLToPath(import.meta.url),
          "../../../../"
        );
        templateDir = path.resolve(packageDir, "templates/default");

        if (fs.existsSync(templateDir)) {
          foundLocally = true;
        } else {
          // Try with node_modules paths
          const possiblePaths = [
            // When installed globally or via npx/bunx
            path.resolve(
              process.execPath,
              "../../lib/node_modules/pocketnext/templates/default"
            ),
            // Current working directory
            path.resolve(process.cwd(), "templates/default"),
            // When running from source
            path.resolve(
              process.cwd(),
              "node_modules/pocketnext/templates/default"
            ),
          ];

          for (const potentialPath of possiblePaths) {
            if (fs.existsSync(potentialPath)) {
              templateDir = potentialPath;
              foundLocally = true;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          "Could not find local templates, will try downloading from GitHub..."
        )
      );
    }

    // If templates weren't found locally, try to fetch from GitHub
    if (!foundLocally) {
      const isOnline = await getOnline();

      if (!isOnline) {
        console.error(
          chalk.red(
            "Error: Cannot find templates locally and you appear to be offline."
          )
        );
        console.log(chalk.yellow("To fix this, you can:"));
        console.log("1. Connect to the internet to download templates");
        console.log("2. Run from the source directory with templates folder");
        console.log("3. Clone the repository from GitHub");
        throw new Error(
          "Template directory not found and cannot download (offline)"
        );
      }

      try {
        console.log(
          chalk.yellow(
            "Templates not found locally. Downloading from GitHub..."
          )
        );
        templateDir = await fetchTemplatesFromGitHub(resolvedPath);
      } catch (error) {
        console.error(chalk.red("Error: Failed to download templates."));
        console.log(chalk.yellow("To fix this, you can:"));
        console.log("1. Run from the source directory");
        console.log("2. Install pocketnext globally with npm/bun");
        console.log("3. Clone the repository from GitHub");
        throw new Error("Failed to get templates: " + (error as Error).message);
      }
    }

    // Copy template to destination
    const copySpinner = ora(
      `Creating project in ${chalk.cyan(resolvedPath)}...`
    ).start();
    try {
      // Check if we found a valid template directory
      if (!templateDir) {
        throw new Error("Could not locate template directory");
      }

      await fs.copy(templateDir, resolvedPath, {
        overwrite: true,
        filter: (src) => !src.includes("node_modules") && !src.includes(".git"),
      });
      copySpinner.succeed(`Created project in ${chalk.cyan(resolvedPath)}`);
    } catch (error) {
      copySpinner.fail(
        `Failed to create project in ${chalk.red(resolvedPath)}`
      );
      console.error(error);
      await cleanup();
      process.exit(1);
    }

    // Apply feature selections to the copied files
    const featureSpinner = ora(
      "Customizing project based on selections..."
    ).start();
    try {
      await applyFeatures(resolvedPath, featureSelections);
      featureSpinner.succeed("Project customized successfully");
    } catch (error) {
      featureSpinner.fail(
        `Failed to apply features: ${(error as Error).message}`
      );
      throw error;
    }

    // Install dependencies
    if (!options.skipInstall) {
      const spinner = ora("Installing dependencies...").start();
      try {
        const installArgs = packageManager === "npm" ? ["install"] : [];
        await execa(packageManager, installArgs, {
          cwd: resolvedPath,
        });
        spinner.succeed("Dependencies installed successfully");
      } catch (error) {
        spinner.fail("Failed to install dependencies");
        console.error(
          chalk.red("Installation failed, continuing without dependencies")
        );
      }
    }
  } catch (error) {
    // Clean up on error
    await cleanup();
    // Report error
    console.error(chalk.red("Failed to create project:"), error);
    process.exit(1);
  } finally {
    // Always remove the event handlers
    process.off("SIGINT", handleSigInt);
    process.off("SIGTERM", handleSigInt);
  }
}
