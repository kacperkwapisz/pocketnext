import { describe, expect, test, beforeEach } from "vitest";
import fs from "fs-extra";
import os from "os";
import { getTemplatePaths, removeGitFromTemplate } from "../../src/utils";

// Mock the modules
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

  describe("getTemplatePaths", () => {
    test("returns the correct template paths", async () => {
      const result = await getTemplatePaths();

      expect(result).toEqual({
        tempPath: "/tmp/pocketnext-template",
        templatePath: "/tmp/pocketnext-template/template",
      });

      expect(fs.ensureDir).toHaveBeenCalledWith("/tmp/pocketnext-template");
      expect(fs.emptyDir).toHaveBeenCalledWith("/tmp/pocketnext-template");
      expect(fs.ensureDir).toHaveBeenCalledWith(
        "/tmp/pocketnext-template/template"
      );
    });
  });

  describe("removeGitFromTemplate", () => {
    test("removes .git directory if it exists", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      await removeGitFromTemplate("/path/to/template");

      expect(fs.existsSync).toHaveBeenCalledWith("/path/to/template/.git");
      expect(fs.remove).toHaveBeenCalledWith("/path/to/template/.git");
    });

    test("does nothing if .git directory doesn't exist", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await removeGitFromTemplate("/path/to/template");

      expect(fs.existsSync).toHaveBeenCalledWith("/path/to/template/.git");
      expect(fs.remove).not.toHaveBeenCalled();
    });
  });
});
