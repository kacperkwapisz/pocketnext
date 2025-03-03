# Tests for PocketNext CLI

This directory contains tests for the PocketNext CLI tool.

## Test Structure

- **CLI tests**: Tests the command-line argument parsing and option handling.
- **Spinner tests**: Tests the interactive spinner integration for project creation.
- **Basic tests**: Simple tests for various utilities and helpers.

## Running Tests

```bash
# Run all tests
bun test:all

# Run specific test categories
bun test:cli     # CLI tests only
bun test:spinner # Spinner tests only
bun test:utils   # Utility tests only

# Run tests in watch mode
bun test:watch
```

## Testing Philosophy

We focus on testing the most critical user-facing functionality:

1. **Command-line interfaces**: How users interact with the tool
2. **User experience features**: Spinners, progress indicators, etc.
3. **Core utilities**: Helper functions that are used throughout the codebase

We avoid testing implementation details or complex file system operations that would require extensive mocking. Instead, we focus on the functionality that directly impacts users.

## Adding New Tests

When adding new tests:

1. Focus on testing user-facing behavior
2. Minimize mocking complexity
3. Group related tests in logical files
4. Update the test scripts in package.json if needed

## Mocking Guidelines

- Use simple mocks for dependencies with `vi.mock()`
- For file system operations, focus on testing high-level behavior rather than implementation details
- When mocking command execution, focus on ensuring the right commands would be run, not on simulating their execution
