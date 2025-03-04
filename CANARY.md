# Canary Releases for PocketNext

This document outlines how canary releases work in the PocketNext project and how to use them.

## What are Canary Releases?

Canary releases are preview versions of the PocketNext CLI that include experimental features still under development. These versions allow users to test new functionality before it's available in the stable release.

The name "canary" refers to the historical practice of coal miners bringing canaries into mines to detect toxic gases - they acted as an early warning system. Similarly, canary releases help detect issues before they reach the stable release.

## Current Canary Features

The current canary release includes:

- **Monorepo Template**: A template for creating Next.js projects with a monorepo structure powered by Turborepo
- **Feature Flags**: Support for experimental feature flags
- Additional template options via `--template` flag

## Using Canary Releases

You can install PocketNext from the canary channel using:

```bash
# Using npm
npx pocketnext@canary my-app

# Using bun
bunx pocketnext@canary my-app

# Explicitly using the monorepo template
bunx pocketnext@canary my-app --template monorepo
```

## Versioning Scheme

Canary versions follow this pattern:

```
<base-version>-canary.<timestamp>
```

For example: `0.8.1-canary.20230815123456`

This ensures that each canary release has a unique version number and clearly indicates it's a pre-release version.

## Reporting Issues

When using canary releases, you might encounter bugs or issues. Please report them on our GitHub repository, specifying:

1. The exact canary version you're using
2. The steps to reproduce the issue
3. Expected vs. actual behavior
4. Any error messages or logs

## Contributing to Canary Features

If you'd like to contribute to experimental features in the canary release:

1. Fork the repository
2. Create a feature branch from the `canary` branch
3. Implement your feature
4. Create a Pull Request targeting the `canary` branch

See our [BRANCHING.md](BRANCHING.md) file for more details on our branching strategy.

## Release Cadence

- **Stable Releases**: Published when significant features are ready for production
- **Canary Releases**: Published automatically on every push to the `canary` branch

## How Features Move from Canary to Stable

When an experimental feature in the canary release is considered stable:

1. The feature is thoroughly tested in the canary environment
2. Any known issues are fixed
3. The feature is merged directly from `canary` into `main`
4. The main branch is tagged for a new stable release

This direct path from canary to main ensures a streamlined process while still maintaining quality through thorough testing in the canary environment.
