import chalk from "chalk";
import prompts from "prompts";
import { CreateOptions, ProjectProfile } from "@/types";

// Project profiles definition
export const PROJECT_PROFILES: Record<string, ProjectProfile> = {
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Basic setup with essential features only",
    features: {
      deploymentPlatform: "standard",
      dockerConfig: "none",
      imageLoader: "wsrv",
      includeGithubWorkflows: false,
      scriptsHandling: "keep",
    },
  },
  standard: {
    id: "standard",
    name: "Standard",
    description: "Recommended setup for most projects",
    features: {
      deploymentPlatform: "vercel",
      dockerConfig: "standard",
      imageLoader: "vercel",
      includeGithubWorkflows: true,
      scriptsHandling: "runAndKeep",
    },
  },
  production: {
    id: "production",
    name: "Production",
    description: "Full setup with CI/CD and deployment configuration",
    features: {
      deploymentPlatform: "coolify",
      dockerConfig: "coolify",
      imageLoader: "coolify",
      includeGithubWorkflows: true,
      scriptsHandling: "runAndDelete",
    },
  },
  custom: {
    id: "custom",
    name: "Custom",
    description: "Choose each option individually",
    features: {},
  },
};

/**
 * Prompt for a project profile
 */
export async function promptForProfile(): Promise<string> {
  const profileChoices = Object.values(PROJECT_PROFILES).map((profile) => ({
    title: profile.name,
    description: profile.description,
    value: profile.id,
  }));

  const response = await prompts(
    {
      type: "select",
      name: "profile",
      message: "Project setup profile:",
      choices: profileChoices,
      initial: 1, // Default to standard
    },
    {
      onCancel: () => {
        console.log(chalk.yellow("\nOperation canceled by user. Exiting..."));
        process.exit(0);
      },
    }
  );

  // This should never be reached if cancelled, but keep as fallback
  return response.profile || "standard";
}

/**
 * Apply feature selections from a project profile
 */
export function applyProfileSettings(
  options: CreateOptions,
  profile: string
): CreateOptions {
  // If custom profile is selected, return original options but ensure profile is set
  if (profile === "custom") {
    return { ...options, profile: "custom" };
  }

  // Get the selected profile
  const selectedProfile = PROJECT_PROFILES[profile];
  if (!selectedProfile || !selectedProfile.features) {
    console.warn(
      chalk.yellow(
        `Profile "${profile}" not found or incomplete. Using standard settings.`
      )
    );
    return { ...options, profile: "standard" };
  }

  // Apply the profile settings, preserving explicitly set options
  const updatedOptions = { ...options, profile };

  // Only apply profile settings for options that weren't explicitly set in CLI
  const profileOptions = selectedProfile.features;
  for (const [key, value] of Object.entries(profileOptions)) {
    // Apply only if not explicitly set in options
    if (!(key in options) || options[key] === undefined) {
      // Use type assertion to handle the dynamic key assignment
      (updatedOptions as any)[key] = value;
    }
  }

  return updatedOptions;
}
