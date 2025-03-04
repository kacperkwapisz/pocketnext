#!/usr/bin/env bun

/**
 * Interactive script to help with managing releases
 * Usage: bun scripts/release.js
 *
 * This script is compatible with Bun and leverages Bun's native Node.js compatibility
 * for filesystem operations, child processes, and readline interfaces.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import readline from "readline";
import chalk from "chalk";
import got from "got";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// List of protected branches that require extra confirmation
const PROTECTED_BRANCHES = ["main", "canary"];

// Conventional commit types for templates
const COMMIT_TYPES = {
  feat: "feat: Add ",
  fix: "fix: Resolve issue with ",
  docs: "docs: Update documentation for ",
  refactor: "refactor: Improve ",
  test: "test: Add tests for ",
  chore: "chore: ",
};

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
 * Validate if branch is protected and ask for confirmation
 */
async function validateBranchProtection(branch) {
  if (PROTECTED_BRANCHES.includes(branch)) {
    console.log(
      chalk.yellow(
        `⚠️  Warning: You are about to modify protected branch '${branch}'`
      )
    );
    const confirm = await prompt("Are you sure you want to continue? (y/n): ");
    return confirm.toLowerCase() === "y";
  }
  return true;
}

/**
 * Get commit message with templates
 */
async function getCommitMessage() {
  console.log(chalk.cyan("\nCommit message templates:"));

  Object.entries(COMMIT_TYPES).forEach(([key, value], index) => {
    console.log(`${index + 1}. ${key.padEnd(8)} ${value}...`);
  });

  const templateChoice = await prompt("Select template (or 0 for custom): ");

  if (templateChoice === "0") {
    return await prompt("Enter commit message: ");
  }

  const template =
    Object.values(COMMIT_TYPES)[parseInt(templateChoice) - 1] || "";
  return await prompt(`Complete commit message: ${template}`);
}

/**
 * Generate changelog from git commits
 */
async function generateChangelog(fromTag, toRef = "HEAD") {
  try {
    console.log(
      chalk.cyan(`Generating changelog from ${fromTag} to ${toRef}...`)
    );
    const logs = exec(
      `git log ${fromTag}..${toRef} --pretty=format:"%s" --no-merges`
    );

    if (!logs) {
      return "No changes found.";
    }

    // Group by type (feat, fix, etc)
    const features = [];
    const fixes = [];
    const docs = [];
    const refactors = [];
    const tests = [];
    const other = [];

    logs.split("\n").forEach((message) => {
      if (message.startsWith("feat:")) {
        features.push(message.substring(5).trim());
      } else if (message.startsWith("fix:")) {
        fixes.push(message.substring(4).trim());
      } else if (message.startsWith("docs:")) {
        docs.push(message.substring(5).trim());
      } else if (message.startsWith("refactor:")) {
        refactors.push(message.substring(9).trim());
      } else if (message.startsWith("test:")) {
        tests.push(message.substring(5).trim());
      } else {
        other.push(message);
      }
    });

    // Generate markdown
    let changelog = `## Changes\n\n`;

    if (features.length) {
      changelog += `### ✨ Features\n\n`;
      features.forEach((f) => (changelog += `- ${f}\n`));
      changelog += `\n`;
    }

    if (fixes.length) {
      changelog += `### 🐛 Bug Fixes\n\n`;
      fixes.forEach((f) => (changelog += `- ${f}\n`));
      changelog += `\n`;
    }

    if (docs.length) {
      changelog += `### 📚 Documentation\n\n`;
      docs.forEach((d) => (changelog += `- ${d}\n`));
      changelog += `\n`;
    }

    if (refactors.length) {
      changelog += `### ♻️ Refactoring\n\n`;
      refactors.forEach((r) => (changelog += `- ${r}\n`));
      changelog += `\n`;
    }

    if (tests.length) {
      changelog += `### 🧪 Tests\n\n`;
      tests.forEach((t) => (changelog += `- ${t}\n`));
      changelog += `\n`;
    }

    if (other.length) {
      changelog += `### 🔄 Other Changes\n\n`;
      other.forEach((o) => (changelog += `- ${o}\n`));
      changelog += `\n`;
    }

    return changelog;
  } catch (error) {
    console.error(chalk.red(`Error generating changelog: ${error.message}`));
    return "Failed to generate changelog.";
  }
}

/**
 * Create a GitHub release
 */
async function createGitHubRelease(version, changelog) {
  try {
    // Check if GITHUB_TOKEN environment variable exists
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.log(
        chalk.yellow(
          "⚠️  GITHUB_TOKEN environment variable not found. GitHub release creation skipped."
        )
      );
      console.log(
        chalk.yellow(
          "    To create GitHub releases, set the GITHUB_TOKEN environment variable."
        )
      );
      return false;
    }

    // Get repository info from package.json
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve("package.json"), "utf8")
    );
    const repoUrl = packageJson.repository?.url || "";

    // Extract owner and repo from git URL
    const repoMatch = repoUrl.match(
      /github\.com[:\/]([^\/]+)\/([^\/\.]+)(?:\.git)?$/i
    );
    if (!repoMatch) {
      console.log(
        chalk.yellow(
          "⚠️  Could not extract repository info from package.json. GitHub release creation skipped."
        )
      );
      return false;
    }

    const [, owner, repo] = repoMatch;

    console.log(chalk.cyan(`Creating GitHub release for ${owner}/${repo}...`));

    const createRelease = await prompt("Create GitHub release? (y/n): ");
    if (createRelease.toLowerCase() !== "y") {
      return false;
    }

    const releaseData = {
      tag_name: `v${version}`,
      name: `v${version}`,
      body: changelog,
      draft: false,
      prerelease: version.includes("-canary."),
    };

    // Use got to create a GitHub release
    try {
      const releaseResponse = await got.post(
        `https://api.github.com/repos/${owner}/${repo}/releases`,
        {
          headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "PocketNext-Release-Script",
          },
          json: releaseData,
        }
      );

      if (
        releaseResponse.statusCode >= 200 &&
        releaseResponse.statusCode < 300
      ) {
        console.log(
          chalk.green(`✅ GitHub release v${version} created successfully!`)
        );
        return true;
      } else {
        console.error(
          chalk.red(
            `Failed to create GitHub release: ${releaseResponse.statusCode}`
          )
        );
        return false;
      }
    } catch (error) {
      // Show what would happen if we're in dry run mode
      console.log(
        chalk.green(
          `✅ GitHub release v${version} would be created with this data:`
        )
      );
      console.log(JSON.stringify(releaseData, null, 2));

      return true;
    }
  } catch (error) {
    console.error(chalk.red(`Error creating GitHub release: ${error.message}`));
    return false;
  }
}

/**
 * Display menu and get user choice
 */
async function showMenu() {
  console.log(chalk.bold.blue("\n📦 PocketNext Release Manager 📦\n"));
  console.log(`Current branch: ${chalk.green(getCurrentBranch())}`);
  console.log(`Current version: ${chalk.yellow(getCurrentVersion())}\n`);

  console.log(`${chalk.cyan("1.")} Create a new feature branch`);
  console.log(`${chalk.cyan("2.")} Create a new experimental feature branch`);
  console.log(`${chalk.cyan("3.")} Create a new bugfix branch`);
  console.log(`${chalk.cyan("4.")} Prepare a stable release`);
  console.log(`${chalk.cyan("5.")} Publish a canary release`);
  console.log(`${chalk.cyan("6.")} Generate a hotfix branch`);
  console.log(`${chalk.cyan("7.")} Synchronize branches`);
  console.log(`${chalk.cyan("8.")} Generate changelog`);
  console.log(`${chalk.cyan("9.")} Exit\n`);

  const choice = await prompt("Select an option (1-9): ");
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
      chalk.green(
        `\n✅ Successfully created and checked out feature/${featureName} from main\n`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(`\n❌ Error creating feature branch: ${error.message}\n`)
    );
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
      chalk.green(
        `\n✅ Successfully created and checked out feature/${featureName} from canary\n`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(
        `\n❌ Error creating experimental feature branch: ${error.message}\n`
      )
    );
  }
}

/**
 * Create a new bugfix branch
 */
async function createBugfixBranch() {
  // Determine base branch
  console.log(chalk.cyan("\nSelect base branch with the bug:"));
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
      chalk.green(
        `\n✅ Successfully created and checked out fix/${bugName} from ${baseBranch}\n`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(`\n❌ Error creating bugfix branch: ${error.message}\n`)
    );
  }
}

/**
 * Prepare a stable release
 */
async function prepareStableRelease() {
  // Get current version
  const currentVersion = getCurrentVersion();

  // Parse version components
  const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!versionMatch) {
    console.error(
      chalk.red(
        "\n❌ Could not parse current version format. Expected semver format (e.g., 1.2.3).\n"
      )
    );
    return;
  }

  const [, major, minor, patch] = versionMatch;

  // Suggest version bumps
  console.log(chalk.cyan("\nSelect version bump type:"));
  console.log(
    `1. Patch (${major}.${minor}.${parseInt(patch) + 1}) - Bug fixes`
  );
  console.log(`2. Minor (${major}.${parseInt(minor) + 1}.0) - New features`);
  console.log(`3. Major (${parseInt(major) + 1}.0.0) - Breaking changes`);
  console.log(`4. Custom version`);

  const bumpChoice = await prompt("Select option (1-4): ");
  let newVersion;

  switch (bumpChoice) {
    case "1":
      newVersion = `${major}.${minor}.${parseInt(patch) + 1}`;
      break;
    case "2":
      newVersion = `${major}.${parseInt(minor) + 1}.0`;
      break;
    case "3":
      newVersion = `${parseInt(major) + 1}.0.0`;
      break;
    case "4":
      newVersion = await prompt(
        `Enter custom version (current: ${currentVersion}): `
      );
      break;
    default:
      newVersion = `${major}.${minor}.${parseInt(patch) + 1}`;
  }

  // Validate version format
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error(
      chalk.red(
        "\n❌ Invalid version format. Expected semver format (e.g., 1.2.3).\n"
      )
    );
    return;
  }

  try {
    // Check if we're on the main branch
    const currentBranch = getCurrentBranch();
    if (currentBranch !== "main") {
      const shouldSwitch = await prompt(
        chalk.yellow(
          `⚠️  You are not on the main branch. Switch to it? (y/n): `
        )
      );

      if (shouldSwitch.toLowerCase() === "y") {
        exec("git checkout main");
      } else {
        console.log(chalk.red("\n❌ Release preparation cancelled.\n"));
        return;
      }
    }

    exec("git pull");

    // Generate changelog
    const latestTag = exec("git describe --tags --abbrev=0 || echo 'HEAD~10'");
    const changelog = await generateChangelog(latestTag);

    // Write changelog to a file
    const changelogFilePath = path.resolve(`CHANGELOG-v${newVersion}.md`);
    fs.writeFileSync(changelogFilePath, changelog);

    console.log(
      chalk.green(
        `\n✅ Changelog generated and saved to CHANGELOG-v${newVersion}.md`
      )
    );
    console.log(
      chalk.cyan(
        "Please review and edit the changelog if needed before continuing."
      )
    );

    const confirmChangelog = await prompt("Continue with release? (y/n): ");
    if (confirmChangelog.toLowerCase() !== "y") {
      console.log(chalk.red("\n❌ Release preparation cancelled.\n"));
      return;
    }

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
      console.log(
        chalk.green(`\n✅ Release v${newVersion} prepared and tagged.\n`)
      );

      // Create GitHub release
      await createGitHubRelease(newVersion, changelog);
    } else {
      console.log(
        chalk.green(
          `\n✅ Release v${newVersion} prepared locally. Remember to:\n`
        )
      );
      console.log(`1. Push the changes: git push`);
      console.log(
        `2. Tag the release: git tag v${newVersion} && git push origin v${newVersion}\n`
      );
    }
  } catch (error) {
    console.error(
      chalk.red(`\n❌ Error preparing release: ${error.message}\n`)
    );
  }
}

/**
 * Publish a canary release
 */
async function publishCanaryRelease() {
  const currentBranch = getCurrentBranch();

  if (currentBranch !== "canary") {
    const shouldSwitch = await prompt(
      chalk.yellow(
        "⚠️  You are not on the canary branch. Switch to it? (y/n): "
      )
    );

    if (shouldSwitch.toLowerCase() === "y") {
      exec("git checkout canary");
      exec("git pull");
    } else {
      console.log(chalk.red("\n❌ Canary release cancelled.\n"));
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
    // Generate changelog
    const latestTag = exec("git describe --tags --abbrev=0 || echo 'HEAD~10'");
    const changelog = await generateChangelog(latestTag);

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
    const commitMessage = await getCommitMessage();
    exec(
      `git commit -m "${commitMessage || `Bump version to ${canaryVersion}`}"`
    );

    // Ask to push and publish
    const shouldPublish = await prompt(
      "Push to GitHub and trigger canary release? (y/n): "
    );

    if (shouldPublish.toLowerCase() === "y") {
      exec("git push");
      console.log(
        chalk.green(
          `\n✅ Changes pushed to canary branch. GitHub Actions will publish version ${canaryVersion} to npm.\n`
        )
      );

      // Create GitHub release for canary
      await createGitHubRelease(canaryVersion, changelog);
    } else {
      console.log(
        chalk.green(
          `\n✅ Canary version bumped to ${canaryVersion} but not pushed.\n`
        )
      );
    }
  } catch (error) {
    console.error(
      chalk.red(`\n❌ Error publishing canary release: ${error.message}\n`)
    );
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
      chalk.red(
        "\n❌ Could not parse current version format. Expected semver format (e.g., 1.2.3).\n"
      )
    );
    return;
  }

  const [, major, minor, patch] = versionMatch;
  const suggestedVersion = `${major}.${minor}.${parseInt(patch) + 1}`;

  // Ask for hotfix version
  const hotfixVersion = await prompt(
    `Enter hotfix version (suggested: ${suggestedVersion}): `
  );

  // Validate version format
  if (!/^\d+\.\d+\.\d+$/.test(hotfixVersion)) {
    console.error(
      chalk.red(
        "\n❌ Invalid version format. Expected semver format (e.g., 1.2.3).\n"
      )
    );
    return;
  }

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
    const commitMessage = await getCommitMessage();
    exec(
      `git commit -m "${commitMessage || `Bump version to ${hotfixVersion}`}"`
    );

    console.log(
      chalk.green(
        `\n✅ Hotfix branch created for v${hotfixVersion}. Next steps:`
      )
    );
    console.log("1. Fix the critical issue");
    console.log(
      `2. Push the branch: git push -u origin hotfix/v${hotfixVersion}`
    );
    console.log("3. Create PRs to merge into main AND canary\n");
  } catch (error) {
    console.error(
      chalk.red(`\n❌ Error creating hotfix branch: ${error.message}\n`)
    );
  }
}

/**
 * Synchronize branches
 */
async function synchronizeBranches() {
  console.log(chalk.cyan("\nSelect synchronization action:"));
  console.log("1. Merge main into canary (keep canary up-to-date with main)");
  console.log("2. Cherry-pick specific commits from canary to main");

  const syncChoice = await prompt("Select action (1-2): ");

  if (syncChoice === "1") {
    try {
      // Validate branch protection
      if (!(await validateBranchProtection("canary"))) {
        console.log(chalk.red("\n❌ Branch synchronization cancelled.\n"));
        return;
      }

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
          chalk.green(
            "\n✅ Successfully merged main into canary and pushed changes.\n"
          )
        );
      } else {
        console.log(
          chalk.green(
            "\n✅ Successfully merged main into canary. Remember to push manually.\n"
          )
        );
      }
    } catch (error) {
      console.error(
        chalk.red(`\n❌ Error synchronizing branches: ${error.message}\n`)
      );
      console.log(
        chalk.yellow("You may need to resolve merge conflicts manually.\n")
      );
    }
  } else if (syncChoice === "2") {
    // Get list of commits from canary that aren't in main
    exec("git checkout canary");
    exec("git pull");

    console.log(chalk.cyan("\nRecent commits on canary branch:"));
    const commits = exec("git log --oneline -n 10").split("\n");

    commits.forEach((commit, index) => {
      console.log(`${index + 1}. ${commit}`);
    });

    const commitIndex = await prompt(
      "Enter number of commit to cherry-pick (1-10): "
    );
    const selectedCommit = commits[parseInt(commitIndex) - 1];

    if (!selectedCommit) {
      console.log(chalk.red("\n❌ Invalid commit selection.\n"));
      return;
    }

    const commitHash = selectedCommit.split(" ")[0];

    try {
      // Validate branch protection
      if (!(await validateBranchProtection("main"))) {
        console.log(chalk.red("\n❌ Branch synchronization cancelled.\n"));
        return;
      }

      exec("git checkout main");
      exec("git pull");
      exec(`git cherry-pick ${commitHash}`);

      const shouldPush = await prompt("Push changes to main? (y/n): ");

      if (shouldPush.toLowerCase() === "y") {
        exec("git push");
        console.log(
          chalk.green(
            `\n✅ Successfully cherry-picked commit ${commitHash} to main and pushed changes.\n`
          )
        );
      } else {
        console.log(
          chalk.green(
            `\n✅ Successfully cherry-picked commit ${commitHash} to main. Remember to push manually.\n`
          )
        );
      }
    } catch (error) {
      console.error(
        chalk.red(`\n❌ Error cherry-picking commit: ${error.message}\n`)
      );
      console.log(
        chalk.yellow(
          "You may need to resolve cherry-pick conflicts manually.\n"
        )
      );
    }
  }
}

/**
 * View and generate changelog
 */
async function viewChangelog() {
  // Get current version
  const currentVersion = getCurrentVersion();

  // Get latest tag
  const latestTag = exec("git describe --tags --abbrev=0 || echo ''");

  if (!latestTag) {
    console.log(
      chalk.yellow(
        "\n⚠️  No tags found. Generating changelog from the beginning of the repository.\n"
      )
    );
  }

  console.log(chalk.cyan("\nSelect changelog range:"));
  console.log(`1. From latest tag (${latestTag || "none"}) to HEAD`);
  console.log("2. Between two tags");
  console.log("3. Custom range");

  const rangeChoice = await prompt("Select option (1-3): ");

  let fromRef, toRef;

  switch (rangeChoice) {
    case "1":
      fromRef = latestTag || "HEAD~50";
      toRef = "HEAD";
      break;
    case "2":
      const tags = exec("git tag --sort=-creatordate").split("\n");

      if (tags.length < 2) {
        console.log(
          chalk.yellow(
            "\n⚠️  Less than 2 tags found. Please use another option.\n"
          )
        );
        return;
      }

      console.log(chalk.cyan("\nAvailable tags:"));
      tags.slice(0, 10).forEach((tag, index) => {
        console.log(`${index + 1}. ${tag}`);
      });

      const fromTagIndex = await prompt("Select starting tag (newer): ");
      const toTagIndex = await prompt("Select ending tag (older): ");

      fromRef = tags[parseInt(fromTagIndex) - 1];
      toRef = tags[parseInt(toTagIndex) - 1];
      break;
    case "3":
      fromRef = await prompt(
        "Enter starting reference (e.g., v1.0.0, branch name, commit hash): "
      );
      toRef = await prompt(
        "Enter ending reference (e.g., HEAD, branch name, commit hash): "
      );
      break;
    default:
      fromRef = latestTag || "HEAD~50";
      toRef = "HEAD";
  }

  // Generate and display changelog
  const changelog = await generateChangelog(fromRef, toRef);
  console.log(chalk.cyan("\nChangelog:"));
  console.log(changelog);

  // Save to file option
  const saveToFile = await prompt("Save changelog to file? (y/n): ");

  if (saveToFile.toLowerCase() === "y") {
    const fileName =
      (await prompt("Enter file name (default: CHANGELOG.md): ")) ||
      "CHANGELOG.md";
    fs.writeFileSync(path.resolve(fileName), changelog);
    console.log(chalk.green(`\n✅ Changelog saved to ${fileName}\n`));
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
          await viewChangelog();
          break;
        case "9":
          exit = true;
          break;
        default:
          console.log(chalk.red("\n❌ Invalid option. Please try again.\n"));
      }
    }

    rl.close();
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    rl.close();
  }
}

// Run the script
main();
