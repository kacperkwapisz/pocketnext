import { describe, expect, test } from "vitest";
import { getProjectPath, parseCliOptions } from "../../src/utils/cli";

describe("CLI Utilities", () => {
  describe("getProjectPath", () => {
    test("returns 'my-app' with no arguments", () => {
      expect(getProjectPath([])).toBe("my-app");
    });

    test("returns specified project name", () => {
      expect(getProjectPath(["my-project"])).toBe("my-project");
    });

    test("ignores flags after project name", () => {
      expect(getProjectPath(["my-project", "--yes"])).toBe("my-project");
    });

    test("handles project names with special characters", () => {
      expect(getProjectPath(["my-cool-project_123"])).toBe(
        "my-cool-project_123"
      );
    });
  });

  describe("parseCliOptions", () => {
    test("returns default options with no arguments", () => {
      const options = parseCliOptions([]);

      // Check defaults are set
      expect(options.yes).toBe(false);
      expect(options.skipInstall).toBe(undefined); // This is undefined by default, not false
      expect(options.deploymentPlatform).toBe("standard");
      expect(options.dockerConfig).toBe("standard");
      expect(options.imageLoader).toBe("vercel");
      expect(options.scriptsHandling).toBe("keep");
    });

    test("parses --yes flag", () => {
      const options = parseCliOptions(["--yes"]);
      expect(options.yes).toBe(true);

      // Also test -y shorthand
      const shortOptions = parseCliOptions(["-y"]);
      expect(shortOptions.yes).toBe(true);
    });

    test("parses --quick flag", () => {
      const options = parseCliOptions(["--quick"]);
      expect(options.quick).toBe(true);
      expect(options.profile).toBe("standard");
    });

    test("parses --skip-install flag", () => {
      const options = parseCliOptions(["--skip-install"]);
      expect(options.skipInstall).toBe(true);
    });

    test("parses package manager flags", () => {
      const npmOptions = parseCliOptions(["--use-npm"]);
      expect(npmOptions.useNpm).toBe(true);

      const yarnOptions = parseCliOptions(["--use-yarn"]);
      expect(yarnOptions.useYarn).toBe(true);

      const pnpmOptions = parseCliOptions(["--use-pnpm"]);
      expect(pnpmOptions.usePnpm).toBe(true);

      const bunOptions = parseCliOptions(["--use-bun"]);
      expect(bunOptions.useBun).toBe(true);
    });

    test("parses --profile flag", () => {
      // Test --profile value format
      const options = parseCliOptions(["--profile", "minimal"]);
      expect(options.profile).toBe("minimal");

      // Test --profile=value format
      const equalsOptions = parseCliOptions(["--profile=production"]);
      expect(equalsOptions.profile).toBe("production");
    });

    test("validates profile value", () => {
      const options = parseCliOptions(["--profile", "invalid"]);
      expect(options.profile).toBe("standard"); // Invalid profiles default to standard
    });

    test("parses --pb-version flag", () => {
      const options = parseCliOptions(["--pb-version", "0.25.9"]);
      expect(options.pocketbaseVersion).toBe("0.25.9");
    });

    test("parses --scripts flag", () => {
      const keepOptions = parseCliOptions(["--scripts", "keep"]);
      expect(keepOptions.scriptsHandling).toBe("keep");

      const runKeepOptions = parseCliOptions(["--scripts", "runAndKeep"]);
      expect(runKeepOptions.scriptsHandling).toBe("runAndKeep");

      const runDeleteOptions = parseCliOptions(["--scripts", "runAndDelete"]);
      expect(runDeleteOptions.scriptsHandling).toBe("runAndDelete");
    });

    test("validates scripts value", () => {
      const options = parseCliOptions(["--scripts", "invalid"]);
      expect(options.scriptsHandling).toBe("keep"); // Invalid script handling defaults to keep
    });

    test("parses all flags together", () => {
      const options = parseCliOptions([
        "--yes",
        "--use-yarn",
        "--profile",
        "minimal",
        "--pb-version",
        "0.25.9",
        "--scripts",
        "runAndDelete",
        "--skip-install",
      ]);

      expect(options.yes).toBe(true);
      expect(options.useYarn).toBe(true);
      expect(options.profile).toBe("minimal");
      expect(options.pocketbaseVersion).toBe("0.25.9");
      expect(options.scriptsHandling).toBe("runAndDelete");
      expect(options.skipInstall).toBe(true);
    });

    test("maintains defaults for unspecified options", () => {
      const options = parseCliOptions(["--yes"]);

      expect(options.yes).toBe(true);
      expect(options.skipInstall).toBe(undefined); // Default is undefined, not false
      expect(options.deploymentPlatform).toBe("standard"); // Default
      expect(options.dockerConfig).toBe("standard"); // Default
    });
  });
});
