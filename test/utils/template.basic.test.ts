import { describe, expect, test } from "vitest";
import {
  isURL,
  getRepoName,
  normalizeRepoName,
} from "../../src/utils/template";

describe("Template Utils", () => {
  test("isURL correctly identifies URLs", () => {
    // Valid URLs
    expect(isURL("https://github.com/user/repo")).toBe(true);
    expect(isURL("http://github.com/user/repo")).toBe(true);
    expect(isURL("https://gitlab.com/user/repo")).toBe(true);

    // Invalid URLs
    expect(isURL("github.com/user/repo")).toBe(false);
    expect(isURL("user/repo")).toBe(false);
    expect(isURL("")).toBe(false);
  });

  test("getRepoName extracts repo name from URL", () => {
    expect(getRepoName("https://github.com/user/repo")).toBe("repo");
    expect(getRepoName("https://github.com/user/my-template")).toBe(
      "my-template"
    );
    expect(getRepoName("https://gitlab.com/namespace/project")).toBe("project");
    expect(getRepoName("https://github.com/user/repo-name.git")).toBe(
      "repo-name"
    );

    // Handles URLs with trailing slashes
    expect(getRepoName("https://github.com/user/repo/")).toBe("repo");
  });

  test("normalizeRepoName properly normalizes repository names", () => {
    expect(normalizeRepoName("my-repo")).toBe("my-repo");
    expect(normalizeRepoName("MyRepo")).toBe("my-repo");
    expect(normalizeRepoName("my_repo")).toBe("my-repo");
    expect(normalizeRepoName("my repo")).toBe("my-repo");
    expect(normalizeRepoName("my.repo")).toBe("my-repo");

    // Handles special characters
    expect(normalizeRepoName("my$repo!")).toBe("my-repo");

    // Handles multiple consecutive separators
    expect(normalizeRepoName("my__repo")).toBe("my-repo");
    expect(normalizeRepoName("my--repo")).toBe("my-repo");
    expect(normalizeRepoName("my  repo")).toBe("my-repo");

    // Trims leading and trailing separators
    expect(normalizeRepoName("_my-repo_")).toBe("my-repo");
    expect(normalizeRepoName("-my-repo-")).toBe("my-repo");
  });
});
