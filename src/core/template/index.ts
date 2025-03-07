import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { fileURLToPath } from "url";
import ora from "ora";
import { execSync } from "child_process";
import { safeRemove } from "@/utils/fs";
import got from "got";
import tar from "tar";
import {
  getTemplateBranch,
  getAvailableTemplates,
  getBestBranchForTemplate,
} from "./registry";

/**
 * Get the template directory, either local or remote
 * @param parentSpinner Optional parent spinner to use for download operations
 * @param templateName Name of the template to use (default | monorepo)
 */
export async function getTemplateDirectory(
  parentSpinner?: ReturnType<typeof ora>,
  templateName: string = "default"
): Promise<string> {
  // Validate template name against available templates
  const availableTemplates = getAvailableTemplates();
  if (!availableTemplates.includes(templateName)) {
    console.warn(
      chalk.yellow(
        `Warning: Template "${templateName}" not found. Using default template.`
      )
    );
    templateName = "default";
  }

  let templateDir = "";
  let foundLocally = false;

  // First try to find templates in local paths
  try {
    // Check if we're in development mode and can find local templates
    const currentDir = process.cwd();
    const localTemplateDir = path.join(currentDir, `templates/${templateName}`);

    if (fs.existsSync(localTemplateDir)) {
      foundLocally = true;
      templateDir = localTemplateDir;
    }

    // If not in development dir, check if this is running from a global installation
    if (!foundLocally) {
      const packageDir = path.resolve(
        fileURLToPath(import.meta.url),
        "../../../../../"
      );
      templateDir = path.join(packageDir, `templates/${templateName}`);

      // Check if this directory exists
      if (fs.existsSync(templateDir)) {
        foundLocally = true;
      }
    }
  } catch (error) {
    // Ignore errors, we'll try GitHub fetch next
  }

  if (!foundLocally) {
    try {
      // If templates not found locally, try direct download first
      return await downloadTemplateArchive(parentSpinner, templateName);
    } catch (downloadError) {
      // If direct download fails, try GitHub clone as fallback
      try {
        return await fetchTemplatesFromGitHub(parentSpinner, templateName);
      } catch (error) {
        // If both methods fail, show helpful error message
        console.error(chalk.red("All template download methods failed"));
        console.log(chalk.yellow("To fix this, you can:"));
        console.log("1. Check your internet connection");
        console.log("2. Run from the source directory with templates folder");
        console.log("3. Clone the repository from GitHub");
        throw new Error(
          "Unable to obtain templates. Please check your internet connection or try again later."
        );
      }
    }
  }

  return templateDir;
}

/**
 * Download and extract the template archive directly
 * @param parentSpinner Optional parent spinner to use instead of creating a new one
 * @param templateName Name of the template to use (default | monorepo)
 */
export async function downloadTemplateArchive(
  parentSpinner?: ReturnType<typeof ora>,
  templateName: string = "default"
): Promise<string> {
  const tempDir = path.join(process.cwd(), ".pocketnext-temp");

  // Create temp directory
  fs.ensureDirSync(tempDir);

  // Use the parent spinner if provided, otherwise create a new one
  const usingParentSpinner = !!parentSpinner;
  const spinner =
    parentSpinner || ora("Downloading template archive...").start();

  if (parentSpinner) {
    // Update the parent spinner text
    parentSpinner.text = chalk.bold("Downloading template archive...");
  }

  try {
    // Get the appropriate branch for this template from the registry
    const branchName = getTemplateBranch(templateName);

    // Download the template archive directly from GitHub using the appropriate branch
    const templateUrl = `https://github.com/kacperkwapisz/pocketnext/archive/refs/heads/${branchName}.tar.gz`;

    // Download and extract
    await downloadAndExtract(templateUrl, tempDir, spinner);

    // Create proper template directory structure
    const templatePath = path.join(tempDir, "templates", templateName);

    // Look for templates directory in extracted files
    if (fs.existsSync(path.join(tempDir, "templates", templateName))) {
      // No success message to avoid interrupting main flow
      // Only stop the spinner if we created it (not a parent spinner)
      if (!usingParentSpinner) {
        spinner.stop();
      }
      return path.join(tempDir, "templates", templateName);
    }

    // If not found, we need to create the directory structure
    fs.ensureDirSync(path.join(tempDir, "templates"));
    fs.ensureDirSync(templatePath);

    // Check for sample app directory to copy
    let foundSampleApp = false;
    const possibleSampleDirs = ["example", "sample", "my-app", "app"];

    for (const sampleDir of possibleSampleDirs) {
      if (fs.existsSync(path.join(tempDir, sampleDir))) {
        fs.copySync(path.join(tempDir, sampleDir), templatePath);
        // No logging to avoid interrupting output
        foundSampleApp = true;
        break;
      }
    }

    // If we can't find a sample app, copy appropriate files to create one
    if (!foundSampleApp) {
      // Look for src directory
      if (fs.existsSync(path.join(tempDir, "src"))) {
        fs.copySync(path.join(tempDir, "src"), path.join(templatePath, "src"));
      }

      // Copy necessary files
      const importantFiles = [
        "package.json",
        ".gitignore",
        "README.md",
        "next.config.js",
        "tsconfig.json",
      ];
      for (const file of importantFiles) {
        if (fs.existsSync(path.join(tempDir, file))) {
          fs.copySync(path.join(tempDir, file), path.join(templatePath, file));
          // No logging to avoid interrupting output
        }
      }
    }

    // Verify template directory has necessary files
    if (fs.existsSync(templatePath)) {
      const templateFiles = fs.readdirSync(templatePath);

      if (templateFiles.length === 0) {
        // Try one last approach - look for templates in other locations
        if (fs.existsSync(path.join(tempDir, "templates"))) {
          const templatesDir = fs.readdirSync(path.join(tempDir, "templates"));

          // If there's something in the templates directory, use that
          if (templatesDir.length > 0) {
            fs.copySync(
              path.join(tempDir, "templates"),
              path.join(tempDir, "templates-backup")
            );
            // Only stop the spinner if we created it (not a parent spinner)
            if (!usingParentSpinner) {
              spinner.stop();
            }
            return path.join(tempDir, "templates", templateName);
          }
        }

        // If still empty, this is an error
        throw new Error("Template directory is empty after extraction");
      }
    } else {
      throw new Error("Failed to create template directory");
    }

    // Only stop the spinner if we created it (not a parent spinner)
    if (!usingParentSpinner) {
      spinner.stop();
    }
    return templatePath;
  } catch (error) {
    // Always fail the spinner regardless of whether it's a parent or not
    spinner.fail("Failed to download templates");
    throw error;
  } finally {
    // Only stop the spinner if we created it (not a parent spinner)
    if (!usingParentSpinner) {
      spinner.stop();
    }
  }
}

// Helper function to download and extract an archive
async function downloadAndExtract(
  url: string,
  destDir: string,
  spinner: ReturnType<typeof ora>
): Promise<void> {
  const archivePath = path.join(destDir, "template.tar.gz");

  // Create write stream for the download
  const writeStream = fs.createWriteStream(archivePath);

  // Download the file
  await new Promise<void>((resolve, reject) => {
    got
      .stream(url)
      .pipe(writeStream)
      .on("finish", () => resolve())
      .on("error", reject);
  });

  // Extract the archive without changing spinner text to avoid flickering
  spinner.text = chalk.bold("Extracting templates...");
  await tar.extract({
    file: archivePath,
    cwd: destDir,
    strip: 1, // Remove the top-level directory
  });
}

/**
 * Fetch templates from GitHub if not found locally
 * @param parentSpinner Optional parent spinner to use instead of creating a new one
 * @param templateName Name of the template to use (default | monorepo)
 */
export async function fetchTemplatesFromGitHub(
  parentSpinner?: ReturnType<typeof ora>,
  templateName: string = "default"
): Promise<string> {
  const tempDir = path.join(process.cwd(), ".pocketnext-temp");

  // Create temp directory
  fs.ensureDirSync(tempDir);

  // Use the parent spinner if provided, otherwise create a new one
  const usingParentSpinner = !!parentSpinner;
  const spinner =
    parentSpinner || ora("Fetching templates from GitHub...").start();

  if (parentSpinner) {
    // Update the parent spinner text
    parentSpinner.text = chalk.bold("Fetching templates from GitHub...");
  }

  try {
    // Get the appropriate branch for this template
    // Check if we have a CANARY env variable set to determine preferred branch
    const isCanary = process.env.CANARY === "true";
    const preferredBranch = isCanary ? "canary" : "main";
    const branchName = getBestBranchForTemplate(templateName, preferredBranch);

    // Use git to clone template repository (sparse checkout)
    execSync(
      `git clone --depth 1 --filter=blob:none --sparse --branch ${branchName} https://github.com/kacperkwapisz/pocketnext.git ${tempDir}`,
      { stdio: "ignore" }
    );

    // Navigate to temp directory and configure sparse checkout
    const currentDir = process.cwd();
    process.chdir(tempDir);
    execSync("git sparse-checkout set templates", { stdio: "ignore" });
    process.chdir(currentDir); // Always restore original directory

    // Look for "templates/default" in the cloned repo
    if (fs.existsSync(path.join(tempDir, "templates", templateName))) {
      // No success message to avoid interrupting main flow
      // Only stop the spinner if we created it (not a parent spinner)
      if (!usingParentSpinner) {
        spinner.stop();
      }
      return path.join(tempDir, "templates", templateName);
    }

    // If we couldn't find the templates directory in the expected location
    // Try to locate it in different places
    const possibleTemplateDirs = fs.readdirSync(tempDir);
    for (const dir of possibleTemplateDirs) {
      const fullPath = path.join(tempDir, dir);
      if (
        fs.statSync(fullPath).isDirectory() &&
        fs.existsSync(path.join(fullPath, "templates", templateName))
      ) {
        // Only stop the spinner if we created it (not a parent spinner)
        if (!usingParentSpinner) {
          spinner.stop();
        }
        return path.join(fullPath, "templates", templateName);
      }
    }

    // If still not found, throw error
    throw new Error("Could not locate templates directory in repository");
  } catch (error) {
    // Always fail the spinner regardless of whether it's a parent or not
    spinner.fail(`Failed to fetch templates: ${error}`);
    throw new Error(`Failed to fetch templates: ${error}`);
  } finally {
    // Only stop the spinner if we created it (not a parent spinner)
    if (!usingParentSpinner) {
      spinner.stop();
    }
  }
}

/**
 * Clean up temporary template files
 */
export async function cleanupTemplates(tempDir: string): Promise<void> {
  if (tempDir.includes(".pocketnext-temp") && fs.existsSync(tempDir)) {
    try {
      await safeRemove(path.dirname(tempDir));
    } catch (error) {
      console.warn(
        chalk.yellow("Warning: Failed to clean up temporary template files")
      );
    }
  }
}
