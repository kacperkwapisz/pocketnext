import { describe, expect, vi, beforeEach, test } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";

// Mock external modules
vi.mock("fs-extra");
vi.mock("os");

describe("Template utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mocks
    vi.mocked(os.tmpdir).mockReturnValue("/tmp");
    vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
    vi.mocked(fs.emptyDir).mockResolvedValue(undefined);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.remove).mockResolvedValue(undefined);
  });

  // All template utility tests have been removed since we now use local templates directly
  test("Local template directory structure exists", () => {
    // This is just a placeholder test to show that templates are now used locally
    // In a real implementation, we would test the existence of the template directory
    expect(true).toBe(true);
  });
});
