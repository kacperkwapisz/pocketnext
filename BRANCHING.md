# Branching Strategy & Release Process

This document outlines our branching strategy and release process for maintaining both stable and canary releases of PocketNext.

## Branch Structure

```
main (stable) → hotfix branches
   ↑
   └── feature branches
        ↑
        └── canary (experimental features)
               ↑
               └── feature branches (experimental)
```

### Branch Descriptions

- **main**: Production-ready code that has been thoroughly tested. All stable releases are tagged from this branch.
- **canary**: Contains experimental features like the monorepo template. Used for canary releases.
- **feature/\***: Individual feature branches that branch off main (for standard features) or canary (for experimental features).
- **fix/\***: Bugfix branches that can branch off any branch and merge back when complete.
- **hotfix/\***: Emergency fixes for production issues, branched from main and merged to both main and canary.

## Development Workflow

### Regular Feature Development

1. Create a feature branch from `main`:

   ```
   git checkout main
   git pull
   git checkout -b feature/my-new-feature
   ```

2. Develop, commit, and push your changes:

   ```
   git add .
   git commit -m "Add my new feature"
   git push -u origin feature/my-new-feature
   ```

3. Create a Pull Request to merge into `main`

### Experimental Feature Development (Canary)

1. Create a feature branch from `canary`:

   ```
   git checkout canary
   git pull
   git checkout -b feature/experimental-feature
   ```

2. Develop, commit, and push your changes
3. Create a Pull Request to merge into `canary`

4. After testing on the canary branch, these changes can be merged into `main` when ready for wider release

### Bugfix Process

1. Create a fix branch from the affected branch:

   ```
   git checkout <branch-with-bug>
   git pull
   git checkout -b fix/bug-description
   ```

2. Fix the bug, commit, and push your changes
3. Create a Pull Request to merge into the original branch

4. For critical bugs found in production:
   - Create a `hotfix` branch from `main`
   - Fix the bug and create a PR to `main`
   - After merging to `main`, also merge or cherry-pick the fix to `canary`

## Release Process

### Stable Release

1. When features in `main` are ready for release:

   ```
   git checkout main
   git pull
   ```

2. Update version in package.json and commit:

   ```
   # Update version in package.json
   git add package.json
   git commit -m "Bump version to x.y.z"
   git push
   ```

3. Tag the release:

   ```
   git tag vx.y.z
   git push origin vx.y.z
   ```

4. The GitHub Actions workflow will automatically publish to npm

### Canary Release

1. Push to the `canary` branch:

   ```
   git checkout canary
   git pull
   git add .
   git commit -m "Add experimental feature"
   git push
   ```

2. The GitHub Actions workflow will automatically:
   - Generate a canary version number
   - Publish to npm with the canary tag

## Installing Different Versions

### Stable Version

```
npx pocketnext@latest my-app
```

### Canary Version

```
npx pocketnext@canary my-app
```

## Guidelines for Maintaining Both Branches

1. **Always apply bugfixes to both branches**:

   - Fix on `main` first
   - Cherry-pick or apply the same fix to `canary`

2. **Keep branches synchronized**:

   - Periodically merge `main` into `canary` to keep experimental features up-to-date with stable code
   - When features in `canary` are stable, merge them to `main`

3. **Use feature flags for in-progress work**:

   - When possible, use feature flags instead of separate branches
   - This allows easy toggling of experimental features without branch switching

4. **Test thoroughly before merging to main**:
   - Features from `canary` should be well-tested before reaching `main`
   - Consider using additional automated tests for critical paths
