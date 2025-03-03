import chalk from "chalk";
import readline from "readline";
import gradient from "gradient-string";

export const BLUE = "#0099F7";
export const RED = "#F11712";

/**
 * Creates a styled header with cyan arrows
 */
export function createHeader(text: string): string {
  return chalk.hex(BLUE)(`>>> `) + text;
}

export const pocketNextGradient: ReturnType<typeof gradient> = gradient(
  BLUE,
  RED
);

/**
 * Creates a styled prompt with green question mark
 */
export async function promptUser(
  question: string,
  defaultValue?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const formattedQuestion = defaultValue
      ? `${chalk.green("?")} ${chalk.bold(question)} (${chalk.dim(defaultValue)}) `
      : `${chalk.green("?")} ${chalk.bold(question)} `;

    rl.question(formattedQuestion, (answer) => {
      rl.close();
      // When user presses Enter with no input and a default value is provided,
      // use the default value. This ensures proper handling of Enter key.
      const result = answer.trim() || defaultValue || "";
      resolve(result);
    });

    // Handle Ctrl+C (SIGINT)
    rl.on("SIGINT", () => {
      rl.close();
      // Reject with a specific error so callers can identify SIGINT
      reject(new Error("SIGINT"));
    });
  });
}

/**
 * Log a section header with items underneath
 */
export function logSection(title: string, items: string[]): void {
  console.log(chalk.cyan(title));
  items.forEach((item) => console.log(` - ${item}`));
}

/**
 * Log a command instruction
 */
export function logCommand(
  command: string,
  explanation?: string,
  subcommand?: boolean
): void {
  console.log(
    `${subcommand ? "    " : "  "}- ${chalk.cyan(command)}${explanation ? `: ${explanation}` : ""}`
  );
}

/**
 * Creates a gradient text effect with the PocketNext colors
 */
export function createGradient(text: string): string {
  return pocketNextGradient(text);
}
