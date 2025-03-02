import { describe, expect, test } from "vitest";
import {
  FEATURE_CATEGORIES,
  AVAILABLE_FEATURES,
} from "../../src/core/create-project";

describe("Project Creation - Features", () => {
  test("FEATURE_CATEGORIES contains required category definitions", () => {
    // Verify that our feature categories are defined
    expect(FEATURE_CATEGORIES.length).toBeGreaterThan(0);

    // Check that the deployment platform category exists
    const deploymentCategory = FEATURE_CATEGORIES.find(
      (cat) => cat.id === "deployment"
    );
    expect(deploymentCategory).toBeDefined();
    expect(deploymentCategory?.options.length).toBeGreaterThan(0);

    // Verify that expected deployment platforms are available
    const platforms = deploymentCategory?.options.map((opt) => opt.id);
    expect(platforms).toContain("vercel");
    expect(platforms).toContain("standard");

    // Check that the docker category exists
    const dockerCategory = FEATURE_CATEGORIES.find(
      (cat) => cat.id === "docker"
    );
    expect(dockerCategory).toBeDefined();
    expect(dockerCategory?.options.length).toBeGreaterThan(0);
  });

  test("Docker config options include standard and none", () => {
    const dockerCategory = FEATURE_CATEGORIES.find(
      (cat) => cat.id === "docker"
    );
    const dockerOptions = dockerCategory?.options.map((opt) => opt.id);

    expect(dockerOptions).toContain("standard");
    expect(dockerOptions).toContain("none");
  });

  test("Image loader options include vercel option", () => {
    const imageLoaderCategory = FEATURE_CATEGORIES.find(
      (cat) => cat.id === "imageLoader"
    );
    const imageLoaderOptions = imageLoaderCategory?.options.map(
      (opt) => opt.id
    );

    expect(imageLoaderOptions).toContain("vercel");
  });

  test("AVAILABLE_FEATURES contains feature definitions", () => {
    // Verify that we have at least one defined feature
    expect(Object.keys(AVAILABLE_FEATURES).length).toBeGreaterThan(0);

    // Check the githubActions feature specifically
    const githubActions = AVAILABLE_FEATURES["githubActions"];
    expect(githubActions).toBeDefined();
    expect(githubActions?.name).toBe("GitHub Workflows");
    expect(typeof githubActions?.setup).toBe("function");
  });
});
