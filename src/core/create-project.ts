import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { execa } from "execa";
import type {
  CreateOptions,
  Feature,
  FeatureCategory,
  PocketbaseConfig,
} from "../types";
import {
  getPackageManager,
  getOnline,
  downloadAndExtractRepo,
  removeGitFromTemplate,
  getTemplatePaths,
  safeRemove,
} from "../utils";

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
 * Available features that can be selected during project creation
 */
export const AVAILABLE_FEATURES: Record<string, Feature> = {
  githubActions: {
    name: "GitHub Workflows",
    description: "Add GitHub Actions workflows for CI/CD",
    dependencies: [],
    setup: async (targetDir: string) => {
      // Setup GitHub Actions workflows
      const workflowsDir = path.join(targetDir, ".github", "workflows");
      await fs.ensureDir(workflowsDir);
      // Workflow files will be copied from templates
    },
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
 */
async function applyFeatures(
  targetDir: string,
  selections: Record<string, string | boolean>
): Promise<void> {
  const spinner = ora("Setting up features...").start();

  try {
    // Handle deployment platform
    if (selections.deploymentPlatform !== "vercel") {
      await safeRemove(path.join(targetDir, "vercel.json"));
    }

    if (selections.deploymentPlatform !== "coolify") {
      await safeRemove(path.join(targetDir, "docker-compose.coolify.yml"));
    }

    // Handle Docker configuration
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
    // First, copy the selected loader to loader.ts
    const loaderPath = path.join(targetDir, "loader.ts");

    if (selections.imageLoader === "coolify") {
      const coolifyLoaderPath = path.join(targetDir, "loader-coolify.ts");
      if (await fs.pathExists(coolifyLoaderPath)) {
        await fs.copy(coolifyLoaderPath, loaderPath, { overwrite: true });
      }
    } else if (selections.imageLoader === "wsrv") {
      const wsrvLoaderPath = path.join(targetDir, "loader-wsrv.ts");
      if (await fs.pathExists(wsrvLoaderPath)) {
        await fs.copy(wsrvLoaderPath, loaderPath, { overwrite: true });
      }
    } else {
      // For Vercel, create a simple loader that uses Next's Image component
      const vercelLoaderContent = `// Vercel Image Loader
export default function imageLoader({ src, width, quality }) {
  return \`\${src}?w=\${width}&q=\${quality || 75}\`;
}
`;
      await fs.writeFile(loaderPath, vercelLoaderContent);
    }

    // Remove all the original loader files
    await safeRemove(path.join(targetDir, "loader-coolify.ts"));
    await safeRemove(path.join(targetDir, "loader-wsrv.ts"));

    // Handle GitHub workflows
    if (!selections.includeGithubWorkflows) {
      await safeRemove(path.join(targetDir, ".github"));
    }

    spinner.succeed("Features set up successfully");
  } catch (error) {
    spinner.fail("Failed to set up features");
    console.error(chalk.red("Error details:"), error);
    throw error;
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

  // Set up SIGINT handler
  const handleSigInt = async () => {
    console.log();
    console.log(chalk.red("Process interrupted. Cleaning up..."));
    await cleanup();
    process.exit(0);
  };

  // Register handlers
  const sigintHandler = () => handleSigInt();
  process.on("SIGINT", sigintHandler);
  process.on("SIGTERM", sigintHandler);

  try {
    // Variables to store user selections
    const selectedTemplate = options.template || "kacperkwapisz/pocketnext";
    const featureSelections: Record<string, string | boolean> = {
      deploymentPlatform: options.deploymentPlatform || "standard",
      dockerConfig: options.dockerConfig || "standard",
      imageLoader: options.imageLoader || "vercel",
      includeGithubWorkflows: options.includeGithubWorkflows ?? false,
    };

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
              handleSigInt();
              return false;
            },
          });
          if (proceed === undefined) {
            // User canceled
            handleSigInt();
            return; // Exit the function early
          }
          if (!proceed) {
            process.exit(1);
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
    const packageManager = await getPackageManager(options);

    // Download and extract template
    const { templatePath, tempPath } = await getTemplatePaths();

    await downloadAndExtractRepo({
      repo: selectedTemplate,
      targetPath: tempPath,
    });

    // Copy files from the repository root to the target directory
    await fs.copy(tempPath, resolvedPath);

    // Remove .git directory if it exists
    await removeGitFromTemplate(resolvedPath);

    console.log(`Template files copied to ${resolvedPath}`);

    // Get deployment platform
    console.log("About to prompt for deployment platform");

    let platform;

    try {
      const response = await prompts(
        {
          type: "select",
          name: "platform",
          message: "Deployment Platform",
          choices: [
            {
              title: "Vercel - Configure for Vercel deployment",
              value: "vercel",
            },
            { title: "Coolify", value: "coolify" },
            { title: "Standard", value: "standard" },
          ],
          initial: 0,
        },
        {
          onCancel: () => {
            console.log(
              "Outer cancel handler triggered for platform selection"
            );
            return false;
          },
        }
      );

      platform = response.platform;
      console.log(
        `Selected platform from response: ${platform || "none (undefined)"}`
      );
    } catch (error) {
      console.log(`Error during platform selection: ${error}`);
      platform = "standard"; // Default to standard if there's an error
      console.log(`Defaulting to platform: ${platform}`);
    }

    if (platform === undefined) {
      console.log("Platform selection was undefined - using default");
      platform = "standard";
    }

    featureSelections.deploymentPlatform = platform;
    console.log(`Final selected platform: ${platform}`);

    // If options.yes is true, use defaults without prompting
    if (!options.yes) {
      // Prompt for feature selections if not using --yes flag
      for (const category of FEATURE_CATEGORIES) {
        console.log(`Prompting for ${category.name} selection`);
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
                console.log(`Cancelled selection for ${category.name}`);
                return false;
              },
            }
          );

          const selection = response.selection;
          console.log(
            `Selected ${category.name}: ${selection || "none (undefined)"}`
          );

          if (selection === undefined) {
            // Use default value
            console.log(`Using default for ${category.name}`);
            if (category.id === "workflows") {
              featureSelections.includeGithubWorkflows = false;
            } else {
              // Use the first option as default
              featureSelections[category.id] = category.options[0].id;
            }
          } else {
            if (category.id === "workflows") {
              featureSelections.includeGithubWorkflows =
                selection === "include";
            } else {
              featureSelections[category.id] = selection;
            }
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

    // Apply feature selections
    await applyFeatures(resolvedPath, featureSelections);

    // Install dependencies
    if (!options.skipInstall) {
      const spinner = ora("Installing dependencies...").start();
      try {
        const installArgs = packageManager === "npm" ? ["install"] : [];
        await execa(packageManager, installArgs, {
          cwd: resolvedPath,
          stdio: "ignore",
        });
        spinner.succeed("Dependencies installed successfully");
      } catch (error) {
        spinner.fail("Failed to install dependencies");
        console.error(
          chalk.red("Installation failed, continuing without dependencies")
        );
      }
    }

    // Remove signal handlers
    process.off("SIGINT", sigintHandler);
    process.off("SIGTERM", sigintHandler);

    // Print success message
    console.log();
    console.log(
      chalk.green("Success!"),
      `Created ${projectName} at ${resolvedPath}`
    );
    console.log();
    console.log("Inside that directory, you can run several commands:");
    console.log();
    console.log(
      chalk.cyan(
        `  ${packageManager}${packageManager === "npm" ? " run" : ""} dev`
      )
    );
    console.log("    Starts the development server.");
    console.log();
    console.log(
      chalk.cyan(
        `  ${packageManager}${packageManager === "npm" ? " run" : ""} build`
      )
    );
    console.log("    Builds the app for production.");
    console.log();
    console.log(
      chalk.cyan(
        `  ${packageManager}${packageManager === "npm" ? " run" : ""} start`
      )
    );
    console.log("    Runs the built app in production mode.");
    console.log();
    console.log("We suggest that you begin by typing:");
    console.log();
    console.log(chalk.cyan("  cd"), directory);
  } catch (error) {
    // Clean up on error
    await cleanup();
    // Remove signal handlers
    process.off("SIGINT", sigintHandler);
    process.off("SIGTERM", sigintHandler);
    // Report error
    console.error(chalk.red("Failed to create project:"), error);
    process.exit(1);
  }
}
