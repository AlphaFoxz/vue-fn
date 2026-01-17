# vue-fn

A Vue 3 reactive function utility library providing domain-driven design patterns and reactive state management utilities.

## Features

- **Domain-Driven Design** - Functional implementation of DDD patterns with events, aggregations, and plugins
- **Modular Architecture** - Multiple independently consumable modules with tree-shaking support
- **Vue 3 Reactive** - Built on `@vue/reactivity` for full reactive system integration
- **Type Safety** - Complete TypeScript support for excellent developer experience
- **Client/Server** - Separate `domain` module for browsers, `domain-server` for Node.js environments
- **Cross-Tab State** - `shared-domain` module provides cross-tab/window state sharing via BroadcastChannel API
- **Two-Way Binding** - `bindRef` and `bindReactive` utilities for reactive data binding

## Modules

| Package                                       | Description                                                                                  |
| :-------------------------------------------- | :------------------------------------------------------------------------------------------- |
| [`@vue-fn/domain`](libs/domain)               | Vue-reactive domain implementation with aggregations, plugins, and event system              |
| [`@vue-fn/domain-server`](libs/domain-server) | Server-side variant for Node.js environments                                                 |
| [`@vue-fn/domain-shared`](libs/domain-shared) | Cross-tab/window shared state using BroadcastChannel API                                     |
| [`@vue-fn/timer`](libs/timer)                 | Async utilities: `createTimeout()` for cancellable timeouts, `createDeferred()` for promises |

## Documentation

Full documentation is available at [https://alphafoxz.github.io/vue-fn](https://alphafoxz.github.io/vue-fn)

## Installation

```bash
# Install the main domain module
npm install @vue-fn/domain

# Install other modules as needed
npm install @vue-fn/domain-shared
npm install @vue-fn/timer
```

## Quick Start

```typescript
import { createSingletonAgg } from '@vue-fn/domain';
import { ref } from 'vue';

const counter = createSingletonAgg(() => {
  const count = ref(0);

  return {
    states: {
      count,
    },
    commands: {
      increment() {
        count.value++;
      },
    },
  };
});

// Use the aggregation
counter.api.commands.increment();
console.log(counter.api.states.count.value); // 1
```

## License

UNLICENSED
