import { describe, expect, test } from "vitest";
import { parseCliOptions, getProjectPath } from "../../src/utils/cli";

describe("parseCliOptions", () => {
  test("returns default options when no flags provided", () => {
    const args = ["node", "create-pocketnext", "my-app"];
    const options = parseCliOptions(args);

    expect(options).toMatchObject({
      deploymentPlatform: "standard",
      dockerConfig: "standard",
      imageLoader: "vercel",
      includeGithubWorkflows: false,
      template: "kacperkwapisz/pocketnext",
      yes: false,
    });
  });

  test("parses package manager options correctly", () => {
    const args = ["node", "create-pocketnext", "my-app", "--use-npm"];
    const options = parseCliOptions(args);

    expect(options.useNpm).toBe(true);
  });

  test("parses multiple package manager options", () => {
    const args = [
      "node",
      "create-pocketnext",
      "my-app",
      "--use-npm",
      "--use-bun",
    ];
    const options = parseCliOptions(args);

    expect(options.useNpm).toBe(true);
    expect(options.useBun).toBe(true);
  });

  test("parses skip-install flag correctly", () => {
    const args = ["node", "create-pocketnext", "my-app", "--skip-install"];
    const options = parseCliOptions(args);

    expect(options.skipInstall).toBe(true);
  });

  test("parses yes flag correctly with short option", () => {
    const args = ["node", "create-pocketnext", "my-app", "-y"];
    const options = parseCliOptions(args);

    expect(options.yes).toBe(true);
  });

  test("parses yes flag correctly with long option", () => {
    const args = ["node", "create-pocketnext", "my-app", "--yes"];
    const options = parseCliOptions(args);

    expect(options.yes).toBe(true);
  });

  test("parses deployment option correctly", () => {
    const args = [
      "node",
      "create-pocketnext",
      "my-app",
      "--deployment",
      "vercel",
    ];
    const options = parseCliOptions(args);

    expect(options.deploymentPlatform).toBe("vercel");
  });

  test("parses docker option correctly", () => {
    const args = ["node", "create-pocketnext", "my-app", "--docker", "coolify"];
    const options = parseCliOptions(args);

    expect(options.dockerConfig).toBe("coolify");
  });

  test("parses image-loader option correctly", () => {
    const args = [
      "node",
      "create-pocketnext",
      "my-app",
      "--image-loader",
      "wsrv",
    ];
    const options = parseCliOptions(args);

    expect(options.imageLoader).toBe("wsrv");
  });

  test("parses github-workflows flag correctly", () => {
    const args = ["node", "create-pocketnext", "my-app", "--github-workflows"];
    const options = parseCliOptions(args);

    expect(options.includeGithubWorkflows).toBe(true);
  });

  test("parses template option correctly", () => {
    const args = [
      "node",
      "create-pocketnext",
      "my-app",
      "-t",
      "custom/template",
    ];
    const options = parseCliOptions(args);

    expect(options.template).toBe("custom/template");
  });
});

describe("getProjectPath", () => {
  test("returns the project path when provided", () => {
    const args = ["node", "create-pocketnext", "my-project"];
    // Skip the first two arguments which are 'node' and 'create-pocketnext'
    const projectPath = getProjectPath(args.slice(2));

    expect(projectPath).toBe("my-project");
  });

  test("returns default when no project path provided", () => {
    const args = ["node", "create-pocketnext"];
    // Skip the first two arguments which are 'node' and 'create-pocketnext'
    const projectPath = getProjectPath(args.slice(2));

    expect(projectPath).toBe("my-app");
  });

  test("handles flags without project path", () => {
    const args = ["node", "create-pocketnext", "--use-npm", "--yes"];
    const projectPath = getProjectPath(args.slice(2));

    expect(projectPath).toBe("my-app"); // Should use default
  });

  test("handles project path with flags", () => {
    const args = ["node", "create-pocketnext", "my-custom-app", "--use-npm"];
    const projectPath = getProjectPath(args.slice(2));

    expect(projectPath).toBe("my-custom-app");
  });

  test("properly extracts path when flags come first", () => {
    const args = [
      "node",
      "create-pocketnext",
      "--use-npm",
      "my-app-after-flag",
    ];
    const projectPath = getProjectPath(args.slice(2));

    expect(projectPath).toBe("my-app-after-flag");
  });
});
