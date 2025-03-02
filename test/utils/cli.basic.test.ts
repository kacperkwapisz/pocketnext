import { describe, expect, test } from "vitest";
import { parseCliOptions, getProjectPath } from "../../src/utils/cli";

describe("CLI utilities - basic tests", () => {
  test("parseCliOptions returns default options with no args", () => {
    const args: string[] = [];
    const options = parseCliOptions(args);

    // Check that default options are set
    expect(options.template).toBe("kacperkwapisz/pocketnext");
    expect(options.deploymentPlatform).toBe("standard");
    expect(options.dockerConfig).toBe("standard");
  });

  test("getProjectPath returns default with no args", () => {
    const args: string[] = [];
    const projectPath = getProjectPath(args);

    expect(projectPath).toBe("my-app");
  });

  test("getProjectPath returns provided path", () => {
    const args = ["custom-project"];
    const projectPath = getProjectPath(args);

    expect(projectPath).toBe("custom-project");
  });
});
