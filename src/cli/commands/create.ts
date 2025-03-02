import { Command } from "commander";
import chalk from "chalk";
import { createProject } from "../../core/create-project";
import type { CreateOptions } from "../../types";

/**
 * Validates and normalizes a value against allowed options
 */
function validateOption(
  value: string,
  allowedValues: string[],
  defaultValue: string,
  optionName: string
): string {
  if (!allowedValues.includes(value)) {
    console.warn(
      chalk.yellow(
        `Warning: Invalid ${optionName} "${value}". Using "${defaultValue}" instead.`
      )
    );
    return defaultValue;
  }
  return value;
}

/**
 * Registers the create command with the CLI program
 */
export function createCommand(program: Command): void {
  program
    .command("create")
    .description("Create a new Next.js + PocketBase project")
    .argument("[directory]", "Directory to create the project in", "my-app")
    .option(
      "-t, --template <template>",
      "Template to use (default: kacperkwapisz/pocketnext)",
      "kacperkwapisz/pocketnext"
    )
    .option(
      "--deployment <platform>",
      "Deployment platform: vercel, coolify, standard",
      (value) =>
        validateOption(
          value,
          ["vercel", "coolify", "standard"],
          "standard",
          "deployment platform"
        ),
      "standard"
    )
    .option(
      "--docker <config>",
      "Docker configuration: standard, coolify, none",
      (value) =>
        validateOption(
          value,
          ["standard", "coolify", "none"],
          "standard",
          "docker configuration"
        ),
      "standard"
    )
    .option(
      "--image-loader <type>",
      "Image loader: vercel, coolify, wsrv",
      (value) =>
        validateOption(
          value,
          ["vercel", "coolify", "wsrv"],
          "vercel",
          "image loader"
        ),
      "vercel"
    )
    .option("--github-workflows", "Include GitHub workflow files", false)
    .option("--skip-install", "Skip package installation", false)
    .option("--use-npm", "Use npm instead of auto-detecting package manager")
    .option("--use-yarn", "Use yarn instead of auto-detecting package manager")
    .option("--use-pnpm", "Use pnpm instead of auto-detecting package manager")
    .option("--use-bun", "Use bun instead of auto-detecting package manager")
    .option("-y, --yes", "Skip interactive prompts and use defaults", false)
    .action(async (directory: string, options: CreateOptions) => {
      // Display welcome banner
      console.log();
      console.log(
        `${chalk.blue("Welcome to")} ${chalk.bold.blue("PocketNext")} - ${chalk.blue("Create full-stack Next.js + PocketBase projects")}`
      );

      if (options.template !== "kacperkwapisz/pocketnext") {
        console.log(chalk.blue(`Using template: ${options.template}`));
      }
      console.log();

      try {
        await createProject(directory, options);
      } catch (error) {
        console.error(chalk.red("Failed to create project:"), error);
        process.exit(1);
      }
    });
}
