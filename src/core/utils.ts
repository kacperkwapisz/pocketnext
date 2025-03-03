/**
 * Re-exports file system utilities from the main utils directory
 * This file is maintained for backward compatibility with existing imports
 * @deprecated Use @/utils or @/utils/fs directly
 */

export {
  safeRemove,
  ensureDirectory,
  copyDirectory,
  executeCommand,
  pathExists,
  updatePackageJson,
} from "@/utils/fs";
