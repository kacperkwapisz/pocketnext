#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { createCommand } from "./commands/create";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package version
const packageJsonPath = resolve(__dirname, "../../package.json");
const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8"));

// Display welcome banner
const displayBanner = () => {
  console.log(
    chalk.blue(`
██████╗  ██████╗  ██████╗██╗  ██╗███████╗████████╗███╗   ██╗███████╗██╗  ██╗████████╗
██╔══██╗██╔═══██╗██╔════╝██║ ██╔╝██╔════╝╚══██╔══╝████╗  ██║██╔════╝╚██╗██╔╝╚══██╔══╝
██████╔╝██║   ██║██║     █████╔╝ █████╗     ██║   ██╔██╗ ██║█████╗   ╚███╔╝    ██║   
██╔═══╝ ██║   ██║██║     ██╔═██╗ ██╔══╝     ██║   ██║╚██╗██║██╔══╝   ██╔██╗    ██║   
██║     ╚██████╔╝╚██████╗██║  ██╗███████╗   ██║   ██║ ╚████║███████╗██╔╝ ██╗   ██║   
╚═╝      ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝   ╚═╝   
`)
  );
  console.log(chalk.blue(`v${version} - Next.js + PocketBase Starter`));
  console.log();
};

// Initialize CLI
const initCLI = () => {
  displayBanner();

  const program = new Command();

  program
    .name("pocketnext")
    .version(version)
    .description("Create and manage Next.js + PocketBase projects");

  // Register commands
  createCommand(program);

  // Parse arguments
  program.parse(process.argv);
};

// Run the CLI
initCLI();
