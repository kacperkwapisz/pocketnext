/**
 * Template Registry
 *
 * This file serves as a central registry for all available templates.
 * It maps template names to their source branches and provides metadata.
 * This structure will make it easier to migrate to external repositories in the future if needed.
 */

export interface TemplateInfo {
  branch: string;
  branches?: string[]; // All branches where this template is available
  description: string;
  repository?: string; // For future use with external repositories
  author?: string;
  version?: string;
  isExperimental?: boolean; // Flag for experimental templates
}

/**
 * Template registry - maps templates to their metadata
 */
export const TEMPLATES: Record<string, TemplateInfo> = {
  default: {
    branch: "main",
    branches: ["main", "canary"],
    description: "Standard Next.js + PocketBase structure",
  },
  monorepo: {
    branch: "canary", // Current primary branch
    branches: ["canary"], // Will include "main" once merged
    description: "Turborepo monorepo structure with shared packages",
    isExperimental: true,
  },
  // Future templates can be added here
};

/**
 * Get branch name for a given template
 */
export function getTemplateBranch(templateName: string): string {
  return TEMPLATES[templateName]?.branch || "main";
}

/**
 * Get list of available template names
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(TEMPLATES);
}

/**
 * Get template choices for prompts
 */
export function getTemplateChoices() {
  return Object.entries(TEMPLATES).map(([id, info]) => ({
    title:
      id.charAt(0).toUpperCase() +
      id.slice(1) +
      (info.isExperimental ? " (experimental)" : ""),
    description: info.description,
    value: id,
  }));
}

/**
 * Determines the best branch to use for a template based on availability
 * This allows for graceful fallback if a template isn't in a specific branch
 */
export function getBestBranchForTemplate(
  templateName: string,
  preferredBranch?: string
): string {
  const template = TEMPLATES[templateName];
  if (!template) return "main";

  // If no branches are defined, use the primary branch
  if (!template.branches || template.branches.length === 0) {
    return template.branch;
  }

  // If preferred branch is specified and the template is available in that branch, use it
  if (preferredBranch && template.branches.includes(preferredBranch)) {
    return preferredBranch;
  }

  // Otherwise use the primary branch
  return template.branch;
}
