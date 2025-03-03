# Changelog

All notable changes to the PocketNext starter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Coming soon...

### Fixed

- Coming soon...

### Changed

- Coming soon...

## [0.8.0] - 2025-03-04

### Added

- Implemented direct template download fallback mechanism if GitHub fetching fails
- Added template directory verification to ensure projects always have valid content
- Enhanced the template fetching process to accommodate bunx/npx execution model

### Improved

- Unified spinner management across the entire CLI for a smoother user experience
- Enhanced error handling with better user-friendly messages and troubleshooting tips
- Added verification steps to ensure project directories are properly created

### Fixed

- Fixed template fetching failures when using bunx or npx to run the CLI
- Fixed project directories sometimes being empty despite successful creation
- Fixed spinner inconsistencies between different processes during project creation

## [0.7.9] - 2025-03-03

### Improved

- Enhanced package manager detection to properly identify when CLI is run with Bun
- Getting started instructions now show the correct package manager commands (npm run dev, bun dev, etc.)
- Better consistency when detecting and using package managers throughout the application

## [0.7.8] - 2025-03-02

### Added

- Implemented hybrid template resolution strategy (local + GitHub fallback)
- Added runtime template downloading from GitHub when local templates aren't available

### Fixed

- Fixed GitHub workflow selection not actually creating workflow files and content
- Fixed template resolution when installing via npm or running with bunx/npx
- Enhanced build process to include templates in the dist directory
- Fixed version lookup for more robust package.json detection

### Changed

- Optimized GitHub workflow setup with smart path detection across multiple locations
- Improved feature setup with progress indication
- Added fallback to create default workflow files when template files aren't available
- Reduced code complexity and removed redundancy in template handling
- Updated typegen script to use direct database access instead of environment variables

## [0.7.0] - 2024-07-04

### Added

- Robust SIGINT/Ctrl+C handling for graceful cancellation at any point
- Consistent cleanup of partially created directories when cancelling

### Fixed

- Fixed bug where pressing Enter on prompts would incorrectly abort the operation
- Fixed handling of default values in all prompt types (text, select, confirm)
- Improved image loader configuration for Vercel deployments - no custom loader used

### Changed

- Optimized Vercel image loader setup: no loader.ts file created when using Vercel
- Simplified next.config.ts when using Vercel image optimization

## [0.1.0] - 2025-03-02

### Added

- Initial release of PocketNext starter
- Next.js 15 with App Router configuration
- PocketBase integration with type generation
- Tailwind CSS styling and components
- Docker deployment with separate containers for Next.js and PocketBase
- GitHub Actions workflows for CI/CD
- Coolify deployment configuration
- Cross-platform shell scripts for development
- Admin credentials management with interactive setup
- Comprehensive documentation with command reference
- Environment variable management with .env.example
- Package manager agnostic setup (npm, yarn, pnpm, bun)

[Unreleased]: https://github.com/kacperkwapisz/pocketnext/compare/v0.7.8...HEAD
[0.7.8]: https://github.com/kacperkwapisz/pocketnext/compare/v0.7.0...v0.7.8
[0.7.0]: https://github.com/kacperkwapisz/pocketnext/compare/v0.1.0...v0.7.0
[0.1.0]: https://github.com/kacperkwapisz/pocketnext/releases/tag/v0.1.0
