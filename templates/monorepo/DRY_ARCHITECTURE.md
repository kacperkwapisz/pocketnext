# Extremely DRY Architecture Principles

This document outlines the DRY (Don't Repeat Yourself) principles applied to the PocketNext monorepo. These principles ensure code is defined once and reused everywhere it's needed.

## Core DRY Principles

1. **Single Source of Truth**: Every piece of knowledge has ONE authoritative representation
2. **Centralized Configuration**: Environment variables, constants, and config values defined once
3. **Shared Interfaces**: Type definitions shared across all packages
4. **Composition Over Inheritance**: Smaller pieces combined as needed
5. **Framework-Agnostic Core**: Base functionality doesn't depend on specific frameworks
6. **Framework-Specific Adapters**: Thin adapters for specific framework integrations
7. **Tiered Architecture**: Clear separation between core, framework adapters, and app-specific code
8. **Practical Compatibility**: Finding the right balance between DRY and compatibility
9. **Client/Server Separation**: Strict separation of client and server code
10. **Types-Only Sharing**: Share types across apps while keeping runtime code optimized for each context

## Implementation in PocketBase Integration

### 1. Shared Types, App-Specific Implementations

```
@repo/db                 → apps/web/lib/pocketbase/
└── src/                   ├── client.ts   # Client-optimized implementation
    └── types.ts           └── server.ts   # Server-optimized implementation
```

- **@repo/db**: Contains ONLY type definitions, no runtime code
- **apps/\*/lib/pocketbase**: Each app implements optimized PocketBase clients

### 2. Client/Server Separation

```
apps/web/lib/pocketbase/
├── client.ts   # CLIENT-ONLY code with "use client" directive
├── server.ts   # SERVER-ONLY code (never import in client components)
└── index.ts    # Documentation only, no mixing of concerns
```

Each app organizes its PocketBase integration with strict client/server separation.

### 3. Shared Type System

```typescript
// In @repo/db/src/types.ts - centralized type definitions
export interface UserRecord extends BaseRecord {
  username: string;
  email: string;
  // ...
}

export type TypedPocketBase = PocketBase & {
  // Type extensions for collection methods
};

// Used in all apps
import { TypedPocketBase } from "@repo/db";
const pb = new PocketBase(url) as TypedPocketBase;
```

### 4. Optimized Implementations

While types are shared, each app implements optimized PocketBase clients:

- **Client-side**: Uses document.cookie for persistence
- **Server-side**: Uses AsyncAuthStore with Next.js cookies()
- **Middleware**: Direct PocketBase instance for auth refreshing

### 5. Balance Between DRY and Optimization

We've struck a balance between DRY principles and optimization by:

- **Sharing Types**: Ensures consistency in data structure
- **App-Specific Implementation**: Optimizes code for client/server contexts
- **Clear Patterns**: Consistent patterns across all apps
- **Minimal Dependencies**: No unnecessary abstractions or dependencies

## Benefits

1. **Reduced Maintenance**: Type changes only need to be made in one place
2. **Consistent Types**: All parts of the application use the same type definitions
3. **Simplified Testing**: Each app can test its own implementation without complex dependencies
4. **Easier Onboarding**: Clear separation makes it easy to understand the codebase
5. **Reduced Bundle Size**: No shared runtime code to bundle
6. **Better Performance**: Each context gets an optimized implementation
7. **Faster Development**: Clear patterns for each context
8. **Practical Compatibility**: Works with all framework features like RSC
9. **Smaller Client Bundles**: Server code never shipped to the client

## When to Break DRY

We've strategically broken DRY for runtime code while maintaining it for types because:

1. **Different Optimization Needs**: Client and server need different optimizations
2. **Framework Constraints**: React Server Components require strict separation
3. **Bundle Size Concerns**: Shared runtime code can bloat bundles
4. **Clear Patterns**: Explicit implementations are easier to understand than abstractions

This approach combines the best of both worlds: shared types for consistency, optimized implementations for each context.
