# Home

A Vue 3 reactive function utility library with multiple modules for Tree Shaking optimization. Only used modules are bundled during build.

## Module Overview

### domain

Domain-driven design module providing implementations of core concepts like events, aggregations, and plugins. Built on the `vue` package, suitable for any scenario requiring Vue's reactive features (with or without view rendering).

### domain-server

Server-side domain module with identical functionality to `domain`, designed specifically for Node.js environments. Ideal for server applications, API services, and other scenarios without view rendering.

### shared-domain

Cross-tab shared domain module based on BroadcastChannel API for state sharing across tabs/windows. Provides similar APIs to `domain` with support for both singleton and multi-instance aggregations.

### timer

Async utilities module providing functions like `createTimeout()` (cancellable timeout timer) and `createDeferred()` (Promise utility).

## Installation

```shell
npm install vue-fn
pnpm add vue-fn
```

## Usage

```ts
/* Domain module */
import {
  createRequestEvent,
  createBroadcastEvent,
  createSingletonAgg,
  createMultiInstanceAgg,
  createPluginHelperByAgg,
  bindRef,
  bindReactive
} from 'vue-fn/domain'

/* Server-side domain module */
import {
  createRequestEvent,
  createBroadcastEvent,
  createSingletonAgg,
  createMultiInstanceAgg
} from 'vue-fn/domain-server'

/* Shared domain module */
import {
  createLocalEvent,
  createSharedEvent,
  createSharedSingletonAgg,
  createSharedMultiInstanceAgg
} from 'vue-fn/shared-domain'

/* Timer module */
import { createTimeout, createDeferred } from 'vue-fn/timer'
```
