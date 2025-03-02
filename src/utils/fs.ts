import fs from "fs-extra";
import path from "path";

/**
 * Safely removes a file or directory if it exists
 * @param filePath The path to the file or directory to remove
 * @returns A promise that resolves when the operation is complete
 */
export async function safeRemove(filePath: string): Promise<void> {
  try {
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  } catch (error) {
    console.error(`Warning: Failed to remove ${path.basename(filePath)}`);
  }
}
