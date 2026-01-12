# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Vue 3 reactive function utility library (vue-fn) providing domain-driven design patterns and reactive state management utilities. The library is organized as a monorepo with multiple independently consumable modules under `libs/`.

## Build and Test Commands

```bash
# Full build pipeline (pack + verify + test + sync)
pnpm build

# Build individual steps
pnpm build:pack    # Vite build + generate package.json files for each module
pnpm verify        # TypeScript type checking (composite: false)
pnpm test          # Run tests with coverage
pnpm test-ui       # Run tests with Vitest UI
pnpm build:sync    # Copy README.md to dist/

# Run a single test file
pnpx vitest run <path-to-test-file>
```

## Module Architecture

The project uses a multi-module build system defined in `vite.config.ts`. Each directory under `libs/` is built as a separate ESM module with its own entry point:

- **`pure-domain/`** - Core domain primitives without Vue dependencies. Uses `type-fest` for types (ReadonlyDeep). Event system with request/response and broadcast patterns.
- **`domain/`** - Vue-reactive domain implementation with `@vue/reactivity` types (DeepReadonly, UnwrapNestedRefs). Includes aggregation (singleton/multi-instance), plugin system, and ref binding.
- **`domain-server/`** - Server-side variant of domain module (similar exports to `domain/`, for Node.js environments).
- **`shared-domain/`** - Cross-tab/window shared state using BroadcastChannel API for state synchronization.
- **`timer/`** - Async utilities: `createTimeout()` for cancellable timeouts, `createDeferred()` for promises.

Each module exports from its `index.ts`, and the build system automatically:

1. Discovers all modules in `libs/`
2. Builds each to `dist/<module>/index.mjs` with declarations in `dist/<module>/index.d.ts`
3. Generates a minimal `package.json` in each module's dist directory

## Type System Differences

- **`pure-domain`**: Uses `type-fest`'s `ReadonlyDeep<T>` for immutability
- **`domain`/`domain-server`**: Uses Vue's `DeepReadonly<UnwrapNestedRefs<T>>` for reactive immutability

Both modules implement `createRequestEvent` and `createBroadcastEvent` with identical APIs but different type signatures.

## Key Concepts

### Events

- **Request Events** (`createRequestEvent`): Request-response pattern with listener registration, timeout support, and reply handling
- **Broadcast Events** (`createBroadcastEvent`): Fire-and-forget pub/sub with version tracking

### Aggregations

- **Singleton Agg** (`createSingletonAgg`): Single instance aggregation without lifecycle hooks
- **Multi-Instance Agg** (`createMultiInstanceAgg`): Multiple instances with `id`, EffectScope integration, lifecycle hooks (`onCreated`, `onBeforeInitialize`), and automatic `destroyed` event

Both provide `api` object with `states`, `commands`, and `events` properties, plus `isInitialized` computed ref and `untilInitialized()` promise.

### Plugin System

`createPluginHelperByAgg` / `createPluginHelperByAggCreator` for extending aggregations with plugins.

## TypeScript Configuration

- Root `tsconfig.json`: Extends `@tsconfig/node22`, includes dist/libs, strict mode enabled
- `tsconfig.build.json`: For building, excludes `__test__` directories, emits declarations to `dist/`
- `verbatimModuleSyntax` is enabled - requires explicit type-only imports with `import type`

## Testing

- Vitest with coverage (v8), excludes `**/*.dep.ts` files
- Test files co-located with source code in `__tests__/` directories
- Use `__tests__/*.dep.ts` for shared test fixtures/dependencies
