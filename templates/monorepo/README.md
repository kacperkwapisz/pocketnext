# PocketNext Monorepo

This is a monorepo template for Next.js + PocketBase projects, using Turborepo for build orchestration.

## Features

- 🚀 Next.js app in `apps/web`
- 📦 PocketBase backend in `pb` directory
- 🧩 Shared UI components in `packages/ui`
- 🔄 Turborepo for fast builds and development
- 🎨 shadcn/ui components pre-configured
- 🐳 Docker setup for production deployment

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
# In one terminal
pnpm pb:start

# In another terminal
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
