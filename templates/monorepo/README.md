# PocketNext Monorepo

This is a [Next.js](https://nextjs.org/) monorepo project with [PocketBase](https://pocketbase.io) integration, using [Turborepo](https://turbo.build/repo) for monorepo management.

## Features

- 📁 **Monorepo structure** - Organize your code into apps and packages
- 🗄️ **PocketBase integration** - Backend with admin UI, realtime subscriptions, auth, and file storage
- 🚀 **Next.js** - React framework with App Router, Server Components and RSC
- 🧩 **Shared packages** - UI components, eslint configs, and more
- 🔄 **Fast refresh** - See your changes instantly with Turbopack
- 📦 **pnpm workspaces** - Fast, disk space efficient package management
- 🔍 **TypeScript** - Type safety across all packages and apps
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🧰 **Turborepo** - Integrated PocketBase and Next.js development with a single command
- 🐰 **Bun Support** - Run with pnpm or Bun, whichever you prefer

## Getting Started

### Initial Setup

With pnpm (default):

```bash
# Install dependencies and download PocketBase
pnpm setup

# Start both PocketBase and Next.js with a single command
pnpm dev
```

With Bun:

```bash
# Install dependencies and download PocketBase
pnpm setup:bun  # or bun run setup:bun

# Start both PocketBase and Next.js with a single command
bun run dev
```

### Development Scripts

```bash
# Run both PocketBase and Next.js
pnpm dev  # or bun run dev

# Run PocketBase with admin setup
pnpm setup:admin  # or bun run setup:admin

# Generate TypeScript types from PocketBase schema
pnpm typegen  # or bun run typegen

# Lint all packages and apps
pnpm lint  # or bun run lint

# Type check all packages and apps
pnpm check-types  # or bun run check-types

# Clean PocketBase data (reset to fresh state)
pnpm run clean --filter=@repo/pocketbase  # or bun run clean --filter=@repo/pocketbase

# Reset PocketBase (clean and reinstall)
pnpm run reset --filter=@repo/pocketbase  # or bun run reset --filter=@repo/pocketbase
```

## What's inside?

This monorepo uses [Turborepo](https://turbo.build/repo) with [pnpm](https://pnpm.io) as a package manager. It includes the following packages/apps:

### Apps and Packages

- `apps/web`: a [Next.js](https://nextjs.org/) app with App Router
- `packages/ui`: a shared React component library with Tailwind CSS
- `packages/db`: shared PocketBase client and types
- `packages/eslint-config`: ESLint configurations
- `packages/typescript-config`: TypeScript configurations
- `pb`: PocketBase server as a Turborepo task

### Utilities

This monorepo has some additional tools already setup:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Tailwind CSS](https://tailwindcss.com/) for styling

## Turborepo Pipeline

Turborepo is configured to manage the development workflow:

- `pnpm dev` starts both PocketBase and Next.js simultaneously
- PocketBase is automatically set up as a dependency for the web app
- Environment variables are shared across all services

This makes development simple by:

1. Starting all necessary services in the correct order
2. Restarting services automatically when code changes
3. Sharing environment variables between services
4. Providing consistent commands regardless of package manager

### Task Graph

The monorepo defines the following tasks:

- `dev`: Start development servers (includes PocketBase and Next.js)
- `build`: Build all packages and apps
- `lint`: Run ESLint on all packages
- `check-types`: Run TypeScript type checking
- `setup`: Download PocketBase and set up initial dependencies
- `setup:admin`: Configure PocketBase admin credentials
- `clean`: Clean build outputs
- `reset`: Reset dependencies to a clean state

## Adding New Apps or Packages

To add a new app or package to the monorepo, you can use the following commands:

```bash
# Create a new Next.js app
mkdir -p apps/my-new-app
cd apps/my-new-app
# Initialize with your preferred setup
```

Then add the package to the workspace by updating `pnpm-workspace.yaml` if needed.

## PocketBase Integration

The monorepo includes a PocketBase server that runs alongside your Next.js app. The integration follows a "shared types, optimized implementations" approach:

### Core Architecture

```
packages/db/               # Types-only package
└── src/types.ts           # Shared TypeScript types

apps/web/lib/pocketbase/   # App-specific implementations
├── client.ts              # Client-side optimized code
├── server.ts              # Server-side with AsyncAuthStore
└── index.ts               # Documentation and warnings
```

### Key Principles

1. **Shared Types**: TypeScript types are defined once in the DB package
2. **Context-Optimized Implementations**: Each app implements optimized clients
3. **Strict Client/Server Separation**: No mixing of client and server code
4. **Type Safety**: Full type safety throughout the application

### Client-Side (Browser)

```typescript
// In client components
"use client";
import { pb, login } from "@/lib/pocketbase/client";

function LoginForm() {
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await login(
      formData.get('email') as string,
      formData.get('password') as string
    );
  };

  return (
    <form onSubmit={handleLogin}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Log in</button>
    </form>
  );
}
```

### Server-Side (Next.js)

```typescript
// In server components or API routes
import { createClient } from "@/lib/pocketbase/server";

export default async function ProfilePage() {
  const pb = await createClient();
  // Auth automatically loaded from cookies

  if (!pb.authStore.isValid) {
    return <p>Please log in</p>;
  }

  const user = await pb.collection('users').getOne(pb.authStore.model.id);
  return <div>Welcome, {user.name}</div>;
}
```

### Type Generation

The `pnpm typegen` command generates TypeScript types in the DB package, which are then available to all apps:

```bash
# Generate types from your PocketBase schema
pnpm typegen
```

## Monorepo Structure

```
├── apps/
│   └── web/                # Next.js frontend
├── packages/
│   ├── ui/                 # Shared UI components
│   ├── eslint-config/      # Shared ESLint config
│   └── typescript-config/  # Shared TypeScript config
└── pb/                     # PocketBase files
```

## Adding UI Components

To add components to your app, run:

```bash
pnpm dlx shadcn-ui@latest add button
```

This will place the UI components in the `packages/ui/src/components` directory.

## Using Components

```tsx
import { Button } from "@repo/ui/components/button";
```

## Deployment

Use the included Docker setup to deploy your application:

```bash
docker-compose up -d
```
