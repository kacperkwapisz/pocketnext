import fs from "fs-extra";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";

const execPromise = promisify(exec);

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

/**
 * Create a directory if it doesn't exist
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Copy a directory recursively
 */
export async function copyDirectory(src: string, dest: string): Promise<void> {
  try {
    await fs.copy(src, dest, {
      overwrite: true,
      errorOnExist: false,
    });
  } catch (error) {
    console.error(`Error copying from ${src} to ${dest}:`, error);
    throw error;
  }
}

/**
 * Execute a shell command and return the output
 */
export async function executeCommand(
  command: string,
  options: { cwd?: string } = {}
): Promise<string> {
  try {
    const { stdout } = await execPromise(command, options);
    return stdout.trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`, error);
    throw error;
  }
}

/**
 * Check if a file or directory exists
 */
export function pathExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Update package.json file
 */
export async function updatePackageJson(
  filePath: string,
  updateFn: (data: any) => any
): Promise<void> {
  try {
    // Read the file
    const content = await fs.readFile(filePath, "utf8");

    // Parse to JSON
    const data = JSON.parse(content);

    // Apply updates
    const updatedData = updateFn(data);

    // Write back
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), "utf8");
  } catch (error) {
    console.error(`Error updating package.json at ${filePath}:`, error);
    throw error;
  }
}
