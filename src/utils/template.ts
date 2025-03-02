/**
 * Checks if a string is a valid URL
 */
export function isURL(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Extracts the repository name from a Git URL
 */
export function getRepoName(url: string): string {
  // Handle URLs with .git extension
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith(".git")) {
    cleanUrl = cleanUrl.slice(0, -4);
  }

  // Handle URLs with trailing slash
  if (cleanUrl.endsWith("/")) {
    cleanUrl = cleanUrl.slice(0, -1);
  }

  // Extract the last part of the path
  const parts = cleanUrl.split("/");
  return parts[parts.length - 1];
}

/**
 * Normalizes a repository name by converting to lowercase
 * and replacing special characters with hyphens
 */
export function normalizeRepoName(name: string): string {
  return (
    name
      .replace(/([a-z])([A-Z])/g, "$1-$2") // Convert camelCase to kebab-case first
      .toLowerCase()
      // Replace any character that's not a letter, number, or hyphen with a hyphen
      .replace(/[^a-z0-9-]/g, "-")
      // Replace multiple consecutive hyphens with a single hyphen
      .replace(/-+/g, "-")
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
}
