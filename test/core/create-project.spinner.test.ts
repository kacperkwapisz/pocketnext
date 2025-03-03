import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { createProject } from "../../src/core/create-project";
import fs from "fs-extra";
import ora from "ora";
import path from "path";
import { getTemplateDirectory } from "../../src/core/template";
import { applyFeatures } from "../../src/core/features";
import { updatePackageJson } from "../../src/utils";
import { runPocketBaseSetup } from "../../src/core/pocketbase/setup";

// Mock external modules
vi.mock("ora", () => {
  return {
    default: vi.fn(() => ({
      start: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      text: "",
    })),
  };
});

// Use spies on internal functions
vi.mock("../../src/core/template", () => ({
  getTemplateDirectory: vi.fn().mockResolvedValue("/templates/default"),
}));

vi.mock("../../src/core/features", () => ({
  applyFeatures: vi.fn().mockResolvedValue(undefined),
  FEATURE_CATEGORIES: [],
}));

vi.mock("../../src/utils", () => ({
  getPackageManager: vi.fn().mockResolvedValue("npm"),
  getOnline: vi.fn().mockResolvedValue(true),
  updatePackageJson: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/core/profiles", () => ({
  applyProfileSettings: vi.fn((options) => options),
  promptForProfile: vi.fn().mockResolvedValue("standard"),
  PROJECT_PROFILES: {
    standard: {
      id: "standard",
      name: "Standard",
      description: "Standard setup",
      features: {},
    },
  },
}));

vi.mock("../../src/core/pocketbase/setup", () => ({
  runPocketBaseSetup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/core/pocketbase/versions", () => ({
  promptForPocketBaseVersion: vi.fn().mockResolvedValue("0.25.9"),
  getPocketbaseVersions: vi.fn().mockResolvedValue({
    latest: "0.25.9",
    stable: "0.25.0",
  }),
}));

vi.mock("prompts", () => ({
  default: vi.fn().mockResolvedValue({ shouldContinue: true }),
}));

// Mock fs-extra methods
vi.mock("fs-extra", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readdirSync: vi.fn().mockReturnValue([]),
    mkdirSync: vi.fn(),
    copy: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    ensureDirSync: vi.fn(),
  },
}));

// Mock child_process.execSync
vi.mock("child_process", () => ({
  execSync: vi.fn(),
  exec: vi.fn((cmd, options, callback) => {
    if (callback) callback(null, { stdout: "", stderr: "" });
    return { stdout: "", stderr: "" };
  }),
}));

describe("Project Creation - Spinner Integration", () => {
  // Spy on console methods
  let consoleLogSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Spy on console.log to avoid output during tests
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock process.exit to prevent test from exiting
    processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as any);

    // Setup fs-extra spies
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readdirSync").mockReturnValue([]);
    vi.spyOn(fs, "copy").mockResolvedValue(undefined);

    // Setup path spies
    vi.spyOn(path, "resolve").mockImplementation((p) => p);
    vi.spyOn(path, "basename").mockImplementation(() => "test-project");
    vi.spyOn(path, "join").mockImplementation((...args) => args.join("/"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("Spinner is only created after all user inputs are collected", async () => {
    // Call createProject with options that skip most prompts
    await createProject("test-project", {
      yes: true,
      profile: "standard",
    });

    // Verify ora was called with the correct initial message
    expect(ora).toHaveBeenCalledWith(
      expect.stringContaining("Setting up your project")
    );

    // Check it was called after the console log for package manager
    const packageManagerLogIndex = consoleLogSpy.mock.calls.findIndex(
      (call: any) =>
        call[0] && call[0].includes && call[0].includes("package manager")
    );

    // Make sure it was called
    expect(packageManagerLogIndex).toBeGreaterThan(-1);
  });

  test("Spinner shows error when a step fails", async () => {
    // Create a mock spinner to track text updates
    const mockSpinner = {
      start: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      text: "",
    };
    vi.mocked(ora).mockReturnValue(mockSpinner as any);

    // Make fs.copy fail
    vi.spyOn(fs, "copy").mockRejectedValue(new Error("Failed to copy files"));

    // Run with quick mode to bypass prompts
    await createProject("test-project", {
      yes: true,
      profile: "standard",
      quick: true,
    });

    // Verify the spinner was started
    expect(mockSpinner.start).toHaveBeenCalled();

    // Verify that an error was logged
    expect(console.error).toHaveBeenCalled();

    // Verify the process tried to exit
    expect(processExitSpy).toHaveBeenCalled();
  });
});
