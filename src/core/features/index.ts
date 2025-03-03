import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import type { Ora } from "ora";
import { FeatureCategory, CreateOptions } from "@/types";

// Feature categories for user selection
export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "deployment",
    name: "Deployment Platform",
    description: "Deployment platform:",
    exclusive: true,
    options: [
      {
        id: "vercel",
        name: "Vercel",
        description: "Optimized for Vercel deployment",
      },
      {
        id: "coolify",
        name: "Coolify",
        description: "Self-hosted with Coolify",
      },
      {
        id: "standard",
        name: "Standard",
        description: "Generic deployment configuration",
      },
    ],
  },
  {
    id: "docker",
    name: "Docker Configuration",
    description: "Docker config:",
    exclusive: true,
    options: [
      {
        id: "standard",
        name: "Standard",
        description: "Basic Docker setup",
      },
      {
        id: "coolify",
        name: "Coolify",
        description: "Optimized for Coolify deployment",
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
    description: "Image loader strategy:",
    exclusive: true,
    options: [
      {
        id: "vercel",
        name: "Vercel Image Loader",
        description: "Optimized for Vercel hosting",
      },
      {
        id: "coolify",
        name: "Coolify Image Loader",
        description: "Compatible with Coolify deployment",
      },
      {
        id: "wsrv",
        name: "wsrv.nl Image Service",
        description: "Third-party image optimization service",
      },
    ],
  },
  {
    id: "scripts",
    name: "PocketBase Scripts",
    description: "How would you like to handle PocketBase setup scripts?",
    exclusive: true,
    options: [
      {
        id: "keep",
        name: "Keep Scripts",
        description: "Keep scripts for manual setup",
      },
      {
        id: "runAndKeep",
        name: "Run and Keep",
        description: "Run setup now and keep scripts",
      },
      {
        id: "runAndDelete",
        name: "Run and Delete",
        description: "Run setup now and delete scripts",
      },
    ],
  },
];

/**
 * Apply selected features to the project
 */
export async function applyFeatures(
  targetDir: string,
  options: CreateOptions,
  spinner?: Ora
): Promise<void> {
  // Apply deployment platform configuration
  await applyDeploymentConfig(
    targetDir,
    options.deploymentPlatform || "standard",
    spinner
  );

  // Apply Docker configuration
  await applyDockerConfig(
    targetDir,
    options.dockerConfig || "standard",
    spinner
  );

  // Apply Image Loader configuration
  await applyImageLoaderConfig(
    targetDir,
    options.imageLoader || "vercel",
    spinner
  );

  // Apply GitHub Workflows if enabled
  if (options.includeGithubWorkflows) {
    if (spinner) {
      spinner.text = "Setting up GitHub workflows...";
    } else {
      console.log(chalk.blue("Setting up GitHub workflows..."));
    }
    await setupGitHubWorkflows(targetDir);
  }
}

/**
 * Apply deployment platform configuration
 */
async function applyDeploymentConfig(
  targetDir: string,
  platform: string,
  spinner?: Ora
): Promise<void> {
  // Update spinner or log
  if (spinner) {
    spinner.text = `Applying ${platform} deployment configuration...`;
  } else {
    console.log(chalk.blue(`Applying ${platform} deployment configuration...`));
  }

  // Platform-specific configurations could go here
  // This would modify project files based on the selected platform
}

/**
 * Apply Docker configuration
 */
async function applyDockerConfig(
  targetDir: string,
  config: string,
  spinner?: Ora
): Promise<void> {
  // Update spinner or log
  if (spinner) {
    spinner.text = `Applying ${config} Docker configuration...`;
  } else {
    console.log(chalk.blue(`Applying ${config} Docker configuration...`));
  }

  // Docker-specific configurations
  // This would add/modify Docker files based on the selection
}

/**
 * Apply image loader configuration
 */
async function applyImageLoaderConfig(
  targetDir: string,
  loader: string,
  spinner?: Ora
): Promise<void> {
  // Update spinner or log
  if (spinner) {
    spinner.text = `Configuring ${loader} image loader...`;
  } else {
    console.log(chalk.blue(`Configuring ${loader} image loader...`));
  }

  // Image loader configuration
  // This would configure next.config.js based on the selection
}

/**
 * Set up GitHub workflow files
 */
export async function setupGitHubWorkflows(targetDir: string): Promise<void> {
  console.log(chalk.blue("Setting up GitHub workflow files..."));

  // Create .github directory
  const githubDir = path.join(targetDir, ".github/workflows");
  await fs.ensureDir(githubDir);

  // Create workflow files
  // This would create CI/CD workflow files based on the project's needs
}
