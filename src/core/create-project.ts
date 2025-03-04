import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import prompts from "prompts";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { CreateOptions } from "@/types";
import { getOnline, getPackageManager, updatePackageJson } from "@/utils";
import { safeRemove } from "@/utils/fs";
import { getTemplateDirectory } from "@/core/template";
import { applyFeatures, FEATURE_CATEGORIES } from "@/core/features";
import {
  applyProfileSettings,
  promptForProfile,
  PROJECT_PROFILES,
} from "@/core/profiles";
import {
  promptForPocketBaseVersion,
  getPocketbaseVersions,
} from "@/core/pocketbase/versions";
import { runPocketBaseSetup } from "@/core/pocketbase/setup";

/**
 * Main function to create a new PocketNext project
 */
export async function createProject(
  projectName: string,
  options: Partial<CreateOptions> = {}
): Promise<void> {
  // Allow directory to be undefined/null when called from @latest command
  const targetDir = projectName || "my-app";

  // Resolve target directory
  const resolvedPath = path.resolve(targetDir);

  // Set up variables for cleanup
  let createdDirectory = false;
  let templateDir = "";

  // Check if the target directory exists
  if (fs.existsSync(resolvedPath)) {
    if (fs.readdirSync(resolvedPath).length > 0) {
      // Ask for confirmation before continuing
      if (!options.yes) {
        const { shouldContinue } = await prompts(
          {
            type: "confirm",
            name: "shouldContinue",
            message: `Directory ${chalk.cyan(targetDir)} exists and has content. Proceed anyway?`,
            initial: false,
          },
          {
            onCancel: () => {
              console.log(
                chalk.yellow("\nOperation canceled by user. Exiting...")
              );
              process.exit(0);
            },
          }
        );

        if (!shouldContinue) {
          console.log(chalk.yellow("Operation cancelled."));
          process.exit(0);
        }
      } else {
        // If --yes flag was used, show a warning but continue
        console.warn(
          chalk.yellow(
            `Warning: Dir ${chalk.cyan(targetDir)} exists and has content. Continuing as requested with --yes flag.`
          )
        );
      }
    }
  } else {
    // Mark that we'll be creating a new directory
    createdDirectory = true;
  }

  // Set up cleanup function for interruptions
  const cleanup = async (tempOnly = false) => {
    // Only remove the project directory if we created it ourselves AND we're not doing temp-only cleanup
    // AND the process explicitly failed (exitCode is set to non-zero)
    if (
      createdDirectory &&
      !tempOnly &&
      process.exitCode !== undefined &&
      process.exitCode !== 0
    ) {
      try {
        console.log(
          chalk.yellow(`Cleaning up failed project directory ${resolvedPath}`)
        );
        await fs.remove(resolvedPath);
      } catch (error) {
        console.error(chalk.red(`Error cleaning up ${resolvedPath}`), error);
      }
    }

    // Always clean up template directory if it was temporary
    if (templateDir && templateDir.includes(".pocketnext-temp")) {
      try {
        // First get the parent temp directory
        const tempParentDir = path.join(process.cwd(), ".pocketnext-temp");
        await safeRemove(tempParentDir);
        // Silent cleanup - no message
      } catch (error) {
        console.error(
          chalk.red(`Error cleaning up template directory: ${error}`)
        );
      }
    }
  };

  // Set up SIGINT handler to properly clean up and exit
  const handleSigInt = async () => {
    console.log(chalk.yellow("\nOperation canceled. Cleaning up..."));
    await cleanup();
    process.exit(0);
  };

  // Register the handler
  process.on("SIGINT", handleSigInt);
  process.on("SIGTERM", handleSigInt);

  // Configure global prompt cancellation behavior
  const promptsOptions = {
    onCancel: () => {
      console.log(chalk.yellow("\nOperation canceled by user. Exiting..."));
      process.exit(0);
    },
  };

  try {
    // Step 1: Determine package manager
    const packageManager =
      options.packageManager || (await getPackageManager(options));
    // console.log(chalk.cyan(`Using ${packageManager} as package manager`));

    // Initialize options with package manager
    let finalOptions = {
      ...options,
      packageManager,
    } as CreateOptions & { packageManager: string };

    // Step 2: Determine if using a profile or custom setup
    if (finalOptions.profile) {
      // If profile explicitly passed, use it directly
      finalOptions = applyProfileSettings(
        finalOptions,
        finalOptions.profile
      ) as CreateOptions & { packageManager: string };
    }
    // If not in quick mode and no profile specified, prompt for profile
    else if (!options.yes && !options.quick) {
      // Show profile selection
      const selectedProfile = await promptForProfile();
      finalOptions.profile = selectedProfile;

      // Apply profile settings
      finalOptions = applyProfileSettings(
        finalOptions,
        selectedProfile
      ) as CreateOptions & { packageManager: string };
    }

    // Step 3: Ask for custom options only if 'custom' profile is selected
    // or if specific options weren't set by the profile
    if (!options.yes) {
      // Handle deployment platform
      if (
        finalOptions.profile === "custom" ||
        !finalOptions.deploymentPlatform
      ) {
        // Prompt for deployment platform
        const deploymentCategory = FEATURE_CATEGORIES.find(
          (cat) => cat.id === "deployment"
        );

        if (deploymentCategory) {
          const deploymentSelection = await prompts(
            {
              type: "select",
              name: "option",
              message: deploymentCategory.description,
              choices: deploymentCategory.options.map((option) => ({
                title: option.name,
                description: option.description,
                value: option.id,
              })),
              initial: 0,
            },
            promptsOptions
          );

          if (deploymentSelection.option) {
            finalOptions.deploymentPlatform = deploymentSelection.option;
          }
        }
      }

      // Add template selection prompt if not specified via CLI
      if (!finalOptions.template) {
        const templateSelection = await prompts(
          {
            type: "select",
            name: "template",
            message: "Select project template:",
            choices: [
              {
                title: "Default",
                description: "Standard Next.js + PocketBase structure",
                value: "default",
              },
              {
                title: "Monorepo",
                description:
                  "Turborepo monorepo structure with shared packages",
                value: "monorepo",
              },
            ],
            initial: 0,
          },
          promptsOptions
        );

        if (templateSelection.template) {
          finalOptions.template = templateSelection.template;
        }
      }

      // Handle Docker configuration
      if (finalOptions.profile === "custom" || !finalOptions.dockerConfig) {
        // Prompt for Docker configuration
        const dockerCategory = FEATURE_CATEGORIES.find(
          (cat) => cat.id === "docker"
        );

        if (dockerCategory) {
          const dockerSelection = await prompts(
            {
              type: "select",
              name: "option",
              message: dockerCategory.description,
              choices: dockerCategory.options.map((option) => ({
                title: option.name,
                description: option.description,
                value: option.id,
              })),
              initial: 0,
            },
            promptsOptions
          );

          if (dockerSelection.option) {
            finalOptions.dockerConfig = dockerSelection.option;
          }
        }
      }

      // Handle image loader
      if (finalOptions.profile === "custom" || !finalOptions.imageLoader) {
        // Prompt for image loader
        const imageLoaderCategory = FEATURE_CATEGORIES.find(
          (cat) => cat.id === "imageLoader"
        );

        if (imageLoaderCategory) {
          const imageLoaderSelection = await prompts(
            {
              type: "select",
              name: "option",
              message: imageLoaderCategory.description,
              choices: imageLoaderCategory.options.map((option) => ({
                title: option.name,
                description: option.description,
                value: option.id,
              })),
              initial: 0,
            },
            promptsOptions
          );

          if (imageLoaderSelection.option) {
            finalOptions.imageLoader = imageLoaderSelection.option;
          }
        }
      }

      // Handle GitHub workflows
      if (
        finalOptions.profile === "custom" ||
        finalOptions.includeGithubWorkflows === undefined
      ) {
        // Prompt for GitHub workflows
        const githubSelection = await prompts(
          {
            type: "confirm",
            name: "include",
            message: "Add GitHub CI/CD workflows?",
            initial: false,
          },
          promptsOptions
        );

        finalOptions.includeGithubWorkflows = githubSelection.include;
      }

      // Handle script handling
      if (finalOptions.profile === "custom" || !finalOptions.scriptsHandling) {
        // Prompt for scripts handling
        const scriptsSelection = await prompts(
          {
            type: "select",
            name: "option",
            message: "PocketBase setup scripts handling:",
            choices: [
              {
                title: "Keep scripts",
                description: "Don't run scripts automatically",
                value: "keep",
              },
              {
                title: "Run and keep",
                description: "Run scripts once and keep them",
                value: "runAndKeep",
              },
              {
                title: "Run and delete",
                description: "Run scripts once and delete them",
                value: "runAndDelete",
              },
            ],
            initial: 1, // Default to runAndKeep
          },
          promptsOptions
        );

        if (scriptsSelection.option) {
          finalOptions.scriptsHandling = scriptsSelection.option;
        }
      }

      // Handle PocketBase version
      if (
        finalOptions.profile === "custom" ||
        !finalOptions.pocketbaseVersion
      ) {
        if (!options.yes && !finalOptions.pocketbaseVersion) {
          finalOptions.pocketbaseVersion = await promptForPocketBaseVersion();
        }
      }
    }

    // ALL USER INTERACTIONS COMPLETE

    // Create a main spinner for tracking progress AFTER all selections
    const mainSpinner = ora(chalk.bold("Setting up your project...")).start();

    // Step 4: Actually set up the project with the selected options
    try {
      // Determine template directory
      try {
        // Update spinner text to indicate template search
        mainSpinner.text = chalk.bold("Fetching project templates...");

        templateDir = await getTemplateDirectory(
          mainSpinner,
          finalOptions.template || "default"
        );
        if (!templateDir) {
          throw new Error("Failed to find or create template directory");
        }

        // Update spinner text for the next step
        mainSpinner.text = chalk.bold("Copying template files...");
      } catch (error) {
        mainSpinner.fail("Template setup failed");
        console.error(chalk.red("Error finding templates:"), error);
        console.log(chalk.yellow("\nTroubleshooting tips:"));
        console.log("1. Ensure you have an internet connection");
        console.log("2. Check that Git is installed and in your PATH");
        console.log(
          "3. Try installing globally with: npm install -g pocketnext"
        );
        console.log(
          "4. Try cloning the repository manually and using local files"
        );
        throw error;
      }

      // Copy template files to target directory
      mainSpinner.text = chalk.bold("Copying template files...");
      try {
        // Ensure target directory exists
        fs.ensureDirSync(resolvedPath);
        createdDirectory = true;

        // Check if template directory has contents
        if (!fs.existsSync(templateDir)) {
          throw new Error("Template directory does not exist: " + templateDir);
        }

        // Update main spinner to show we're copying files
        mainSpinner.text = chalk.bold(
          `Copying template files to ${chalk.cyan(resolvedPath)}...`
        );

        // Use the simple fs.copy approach that worked before
        await fs.copy(templateDir, resolvedPath, {
          overwrite: true,
          filter: (src) =>
            !src.includes("node_modules") && !src.includes(".git"),
        });

        // Verify directory was created and has content
        if (!fs.existsSync(resolvedPath)) {
          throw new Error("Project directory was not created: " + resolvedPath);
        }

        // Check if directory has content but don't log the details
        const projectFiles = fs.readdirSync(resolvedPath);
        if (projectFiles.length === 0) {
          // Try direct copying of individual files
          mainSpinner.text = chalk.bold(
            "Directory empty, trying alternative copy method..."
          );

          const templateFiles = fs.readdirSync(templateDir);
          for (const file of templateFiles) {
            // Skip node_modules and .git directories
            if (file === "node_modules" || file === ".git") continue;

            const srcPath = path.join(templateDir, file);
            const destPath = path.join(resolvedPath, file);

            if (fs.statSync(srcPath).isDirectory()) {
              fs.copySync(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          }

          // Check again if files were copied
          const verifyFiles = fs.readdirSync(resolvedPath);
          if (verifyFiles.length === 0) {
            throw new Error(
              "Failed to copy template files to project directory"
            );
          }
        }

        // Update the main spinner to show continued progress
        mainSpinner.text = chalk.bold("Finalizing project setup...");
      } catch (error) {
        mainSpinner.fail("Setup failed");
        console.error(chalk.red("Error copying template files"), error);
        await cleanup();
        process.exit(1);
      }

      // Apply selected features
      await applyFeatures(resolvedPath, finalOptions, mainSpinner);

      // Apply the deployment platform configuration if specified
      if (finalOptions.deploymentPlatform) {
        mainSpinner.text = chalk.bold(
          `Applying ${finalOptions.deploymentPlatform} deployment configuration...`
        );
        await applyFeatures(resolvedPath, finalOptions, mainSpinner);
      }

      // Update package.json with project name and options
      mainSpinner.text = chalk.bold("Updating package.json...");
      await updatePackageJson(
        path.join(resolvedPath, "package.json"),
        (data) => {
          // Update package name
          data.name = path.basename(resolvedPath);
          // Add feature specific package.json changes here
          return data;
        }
      );

      // Install dependencies if not skipped
      if (!finalOptions.skipInstall) {
        mainSpinner.text = chalk.bold("Installing dependencies...");

        try {
          if (packageManager === "yarn") {
            execSync(`cd ${resolvedPath} && yarn install`, { stdio: "ignore" });
          } else if (packageManager === "pnpm") {
            execSync(`cd ${resolvedPath} && pnpm install`, { stdio: "ignore" });
          } else if (packageManager === "bun") {
            execSync(`cd ${resolvedPath} && bun install`, { stdio: "ignore" });
          } else {
            // Default to npm
            execSync(`cd ${resolvedPath} && npm install`, { stdio: "ignore" });
          }
        } catch (error) {
          mainSpinner.fail("Failed to install dependencies");
          console.error(chalk.red("Error installing dependencies"), error);
          await cleanup();
          process.exit(1);
        }
      } else {
        mainSpinner.text = chalk.bold("Skipping dependency installation...");
      }

      // Handle PocketBase setup based on user choice
      const pbSetupOption = finalOptions.scriptsHandling || "keep";

      if (pbSetupOption !== "keep") {
        mainSpinner.text = chalk.bold("Setting up PocketBase...");
        try {
          // Run PocketBase setup on the target directory
          await runPocketBaseSetup(
            resolvedPath,
            packageManager,
            finalOptions.pocketbaseVersion,
            mainSpinner
          );

          // If the user chose to delete the scripts after running them
          if (pbSetupOption === "runAndDelete") {
            mainSpinner.text = chalk.bold(
              "Removing PocketBase setup scripts..."
            );
            // Remove the scripts from package.json and the scripts directory
            await updatePackageJson(
              path.join(resolvedPath, "package.json"),
              (data) => {
                // Remove setup related scripts
                if (data.scripts) {
                  delete data.scripts["setup:db"];
                  delete data.scripts["setup:admin"];
                  delete data.scripts["setup"];
                }
                return data;
              }
            );

            // Remove scripts directory
            const scriptsDir = path.join(resolvedPath, "scripts");
            if (fs.existsSync(scriptsDir)) {
              await fs.remove(scriptsDir);
            }
          }
        } catch (error) {
          mainSpinner.fail("Failed to set up PocketBase");
          console.error(chalk.red("Error setting up PocketBase"), error);
          await cleanup();
          process.exit(1);
        }
      }

      // Final step - update spinner text to show we're completing
      mainSpinner.text = chalk.bold("Completing project setup...");

      // Success! Display completion message
      mainSpinner.succeed("Project setup complete!");

      // Clean up any temporary files but preserve the project
      await cleanup(true);

      // We'll let the calling code handle success messages
      // Project creation completed successfully
      return;
    } catch (error) {
      mainSpinner.fail("Failed to set up project");
      console.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      // Only do a full cleanup (including project directory) on error
      await cleanup();
      process.exit(1);
    }
  } catch (error) {
    // Handle any uncaught errors
    console.error(chalk.red("Failed to set up project"));
    console.error(
      chalk.red(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    // Only do a full cleanup (including project directory) on error
    await cleanup();
    process.exit(1);
  }
}
