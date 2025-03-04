#!/usr/bin/env node

/**
 * Interactive script to help with managing releases
 * Usage: node scripts/release.js
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Execute shell command and return output
 */
function exec(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

/**
 * Get current git branch
 */
function getCurrentBranch() {
  return exec("git rev-parse --abbrev-ref HEAD");
}

/**
 * Ask a question and get user input
 */
async function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Get current version from package.json
 */
function getCurrentVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve("package.json"), "utf8")
  );
  return packageJson.version;
}

/**
 * Display menu and get user choice
 */
async function showMenu() {
  console.log("\n📦 PocketNext Release Manager 📦\n");
  console.log(`Current branch: ${getCurrentBranch()}`);
  console.log(`Current version: ${getCurrentVersion()}\n`);

  console.log("1. Create a new feature branch");
  console.log("2. Create a new experimental feature branch");
  console.log("3. Create a new bugfix branch");
  console.log("4. Prepare a stable release");
  console.log("5. Publish a canary release");
  console.log("6. Generate a hotfix branch");
  console.log("7. Synchronize branches");
  console.log("8. Exit\n");

  const choice = await prompt("Select an option (1-8): ");
  return choice;
}

/**
 * Create a new feature branch
 */
async function createFeatureBranch() {
  // Get feature name
  const featureName = await prompt(
    "Enter feature name (e.g., add-auth-support): "
  );

  // Create and checkout branch
  try {
    exec("git checkout main");
    exec("git pull");
    exec(`git checkout -b feature/${featureName}`);
    console.log(
      `\n✅ Successfully created and checked out feature/${featureName} from main\n`
    );
  } catch (error) {
    console.error(`\n❌ Error creating feature branch: ${error.message}\n`);
  }
}

/**
 * Create a new experimental feature branch
 */
async function createExperimentalFeatureBranch() {
  // Get feature name
  const featureName = await prompt(
    "Enter experimental feature name (e.g., monorepo-support): "
  );

  // Create and checkout branch
  try {
    exec("git checkout canary");
    exec("git pull");
    exec(`git checkout -b feature/${featureName}`);
    console.log(
      `\n✅ Successfully created and checked out feature/${featureName} from canary\n`
    );
  } catch (error) {
    console.error(
      `\n❌ Error creating experimental feature branch: ${error.message}\n`
    );
  }
}

/**
 * Create a new bugfix branch
 */
async function createBugfixBranch() {
  // Determine base branch
  console.log("\nSelect base branch with the bug:");
  console.log("1. main (production)");
  console.log("2. canary (experimental)");

  const baseBranchChoice = await prompt("Select base branch (1-2): ");
  let baseBranch;

  switch (baseBranchChoice) {
    case "1":
      baseBranch = "main";
      break;
    case "2":
      baseBranch = "canary";
      break;
    default:
      baseBranch = "main";
  }

  // Get bugfix name
  const bugName = await prompt(
    "Enter bug description (e.g., fix-template-loading): "
  );

  // Create and checkout branch
  try {
    exec(`git checkout ${baseBranch}`);
    exec("git pull");
    exec(`git checkout -b fix/${bugName}`);
    console.log(
      `\n✅ Successfully created and checked out fix/${bugName} from ${baseBranch}\n`
    );
  } catch (error) {
    console.error(`\n❌ Error creating bugfix branch: ${error.message}\n`);
  }
}

/**
 * Prepare a stable release
 */
async function prepareStableRelease() {
  // Get current version
  const currentVersion = getCurrentVersion();

  // Ask for new version
  const newVersion = await prompt(
    `Enter new version (current: ${currentVersion}): `
  );

  try {
    exec("git checkout main");
    exec("git pull");

    // Update version in package.json
    const packageJsonPath = path.resolve("package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.version = newVersion;
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n"
    );

    // Commit changes
    exec("git add package.json");
    exec(`git commit -m "Bump version to ${newVersion}"`);

    const shouldPush = await prompt(
      "Push changes to main and create tag? (y/n): "
    );

    if (shouldPush.toLowerCase() === "y") {
      exec("git push");
      exec(`git tag v${newVersion}`);
      exec(`git push origin v${newVersion}`);
      console.log(`\n✅ Release v${newVersion} prepared and tagged.\n`);
    } else {
      console.log(
        `\n✅ Release v${newVersion} prepared locally. Remember to:\n`
      );
      console.log(`1. Push the changes: git push`);
      console.log(
        `2. Tag the release: git tag v${newVersion} && git push origin v${newVersion}\n`
      );
    }
  } catch (error) {
    console.error(`\n❌ Error preparing release: ${error.message}\n`);
  }
}

/**
 * Publish a canary release
 */
async function publishCanaryRelease() {
  const currentBranch = getCurrentBranch();

  if (currentBranch !== "canary") {
    const shouldSwitch = await prompt(
      "You are not on the canary branch. Switch to it? (y/n): "
    );

    if (shouldSwitch.toLowerCase() === "y") {
      exec("git checkout canary");
      exec("git pull");
    } else {
      console.log("\n❌ Canary release cancelled.\n");
      return;
    }
  }

  // Get current version and generate canary version
  const currentVersion = getCurrentVersion();
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
  const canaryVersion = `${currentVersion}-canary.${timestamp}`;

  try {
    // Update version in package.json
    const packageJsonPath = path.resolve("package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.version = canaryVersion;
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n"
    );

    // Commit changes
    exec("git add package.json");
    exec(`git commit -m "Bump version to ${canaryVersion}"`);

    // Ask to push and publish
    const shouldPublish = await prompt(
      "Push to GitHub and trigger canary release? (y/n): "
    );

    if (shouldPublish.toLowerCase() === "y") {
      exec("git push");
      console.log(
        `\n✅ Changes pushed to canary branch. GitHub Actions will publish version ${canaryVersion} to npm.\n`
      );
    } else {
      console.log(
        `\n✅ Canary version bumped to ${canaryVersion} but not pushed.\n`
      );
    }
  } catch (error) {
    console.error(`\n❌ Error publishing canary release: ${error.message}\n`);
  }
}

/**
 * Generate a hotfix branch
 */
async function createHotfixBranch() {
  // Get current version
  const currentVersion = getCurrentVersion();

  // Parse version components
  const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!versionMatch) {
    console.error(
      "\n❌ Could not parse current version format. Expected semver format (e.g., 1.2.3).\n"
    );
    return;
  }

  const [, major, minor, patch] = versionMatch;
  const suggestedVersion = `${major}.${minor}.${parseInt(patch) + 1}`;

  // Ask for hotfix version
  const hotfixVersion = await prompt(
    `Enter hotfix version (suggested: ${suggestedVersion}): `
  );

  // Create hotfix branch
  try {
    exec("git checkout main");
    exec("git pull");
    exec(`git checkout -b hotfix/v${hotfixVersion}`);

    // Update version in package.json
    const packageJsonPath = path.resolve("package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.version = hotfixVersion;
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n"
    );

    // Commit changes
    exec("git add package.json");
    exec(`git commit -m "Bump version to ${hotfixVersion}"`);

    console.log(
      `\n✅ Hotfix branch created for v${hotfixVersion}. Next steps:`
    );
    console.log("1. Fix the critical issue");
    console.log(
      `2. Push the branch: git push -u origin hotfix/v${hotfixVersion}`
    );
    console.log("3. Create PRs to merge into main AND canary\n");
  } catch (error) {
    console.error(`\n❌ Error creating hotfix branch: ${error.message}\n`);
  }
}

/**
 * Synchronize branches
 */
async function synchronizeBranches() {
  console.log("\nSelect synchronization action:");
  console.log("1. Merge main into canary (keep canary up-to-date with main)");
  console.log("2. Cherry-pick specific commits from canary to main");

  const syncChoice = await prompt("Select action (1-2): ");

  if (syncChoice === "1") {
    try {
      exec("git checkout canary");
      exec("git pull");
      exec("git checkout main");
      exec("git pull");
      exec("git checkout canary");
      exec("git merge main");

      const shouldPush = await prompt("Push changes to canary? (y/n): ");

      if (shouldPush.toLowerCase() === "y") {
        exec("git push");
        console.log(
          "\n✅ Successfully merged main into canary and pushed changes.\n"
        );
      } else {
        console.log(
          "\n✅ Successfully merged main into canary. Remember to push manually.\n"
        );
      }
    } catch (error) {
      console.error(`\n❌ Error synchronizing branches: ${error.message}\n`);
      console.log("You may need to resolve merge conflicts manually.\n");
    }
  } else if (syncChoice === "2") {
    // Get list of commits from canary that aren't in main
    exec("git checkout canary");
    exec("git pull");

    console.log("\nRecent commits on canary branch:");
    const commits = exec("git log --oneline -n 10").split("\n");

    commits.forEach((commit, index) => {
      console.log(`${index + 1}. ${commit}`);
    });

    const commitIndex = await prompt(
      "Enter number of commit to cherry-pick (1-10): "
    );
    const selectedCommit = commits[parseInt(commitIndex) - 1];

    if (!selectedCommit) {
      console.log("\n❌ Invalid commit selection.\n");
      return;
    }

    const commitHash = selectedCommit.split(" ")[0];

    try {
      exec("git checkout main");
      exec("git pull");
      exec(`git cherry-pick ${commitHash}`);

      const shouldPush = await prompt("Push changes to main? (y/n): ");

      if (shouldPush.toLowerCase() === "y") {
        exec("git push");
        console.log(
          `\n✅ Successfully cherry-picked commit ${commitHash} to main and pushed changes.\n`
        );
      } else {
        console.log(
          `\n✅ Successfully cherry-picked commit ${commitHash} to main. Remember to push manually.\n`
        );
      }
    } catch (error) {
      console.error(`\n❌ Error cherry-picking commit: ${error.message}\n`);
      console.log("You may need to resolve cherry-pick conflicts manually.\n");
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    let exit = false;

    while (!exit) {
      const choice = await showMenu();

      switch (choice) {
        case "1":
          await createFeatureBranch();
          break;
        case "2":
          await createExperimentalFeatureBranch();
          break;
        case "3":
          await createBugfixBranch();
          break;
        case "4":
          await prepareStableRelease();
          break;
        case "5":
          await publishCanaryRelease();
          break;
        case "6":
          await createHotfixBranch();
          break;
        case "7":
          await synchronizeBranches();
          break;
        case "8":
          exit = true;
          break;
        default:
          console.log("\n❌ Invalid option. Please try again.\n");
      }
    }

    rl.close();
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    rl.close();
  }
}

// Run the script
main();
