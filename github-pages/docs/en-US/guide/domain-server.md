# domain-server Module

Server-side domain module with functionality identical to the [domain module](./domain), designed specifically for Node.js environments.

## 1 Differences from domain Module

### 1.1 Similarities

- Identical APIs and functionality
- Same event system (`createRequestEvent`, `createBroadcastEvent`)
- Same aggregation system (`createSingletonAgg`, `createMultiInstanceAgg`)
- Same plugin system (`createPluginHelperByAgg`, `createPluginHelperByAggCreator`)
- Same binding utilities (`bindRef`, `bindReactive`)

### 1.2 Differences

- **Environment**: `domain-server` is designed for Node.js environments, without dependency on Vue's component rendering
- **Dependencies**: Uses `@vue/reactivity` instead of the full `vue` package
- **Use Cases**: Suitable for server applications, API services, CLI tools, and other scenarios without view rendering

## 2 Use Cases

### 2.1 Node.js API Service

```typescript
import { createSingletonAgg, createBroadcastEvent } from 'vue-fn/domain-server'

// User state management
const userAgg = createSingletonAgg(() => {
  const users = ref<Map<string, UserData>>(new Map())
  const onUserChanged = createBroadcastEvent<{ userId: string }>()

  return {
    states: { users },
    actions: {
      addUser(id: string, data: UserData) {
        users.value.set(id, data)
        onUserChanged.publish({ userId: id })
      },
    },
    events: { onUserChanged },
  }
})

// Use in API routes
app.post('/users/:id', (req, res) => {
  userAgg.api.actions.addUser(req.params.id, req.body)
  res.json({ success: true })
})
```

### 2.2 CLI Tool State Management

```typescript
import { createSingletonAgg } from 'vue-fn/domain-server'

const cliState = createSingletonAgg(() => {
  const config = ref<Config | null>(null)
  const isVerbose = ref(false)

  return {
    states: { config, isVerbose },
    actions: {
      setConfig(cfg: Config) { config.value = cfg },
      enableVerbose() { isVerbose.value = true },
    },
  }
})

// Use in CLI commands
cliState.api.actions.setConfig(loadConfig())
if (cliState.api.states.isVerbose.value) {
  console.log('Verbose mode enabled')
}
```

### 2.3 Background Task Processing

```typescript
import { createMultiInstanceAgg } from 'vue-fn/domain-server'

const taskWorker = createMultiInstanceAgg((ctx) => {
  const isRunning = ref(false)
  const progress = ref(0)

  ctx.onScopeDispose(() => {
    // Cleanup resources
    if (isRunning.value) {
      cleanup()
    }
  })

  return {
    states: { isRunning, progress },
    actions: {
      async start() {
        isRunning.value = true
        for (let i = 0; i < 100; i++) {
          await processChunk(i)
          progress.value = i + 1
        }
        isRunning.value = false
      },
    },
  }
})

// Start task
await taskWorker.api.actions.start()
```

### 2.4 Microservice Communication

```typescript
import { createRequestEvent, createSingletonAgg } from 'vue-fn/domain-server'

const serviceAgg = createSingletonAgg(() => {
  // Create request event for service-to-service calls
  const getDataRequest = createRequestEvent(
    { id: '' },
    (id: string) => {
      return fetchFromDatabase(id)
    }
  )

  return {
    states: {},
    actions: {},
    events: {
      getDataRequest,
    },
  }
})

// Request data from other services
const data = await serviceAgg.api.events.getDataRequest.publishRequest({
  id: '123',
})
```

## 3 Installation and Usage

### 3.1 Installation

```bash
npm install vue-fn
# or
pnpm add vue-fn
```

### 3.2 Import

```typescript
// Server-side domain module
import {
  createRequestEvent,
  createBroadcastEvent,
  createSingletonAgg,
  createMultiInstanceAgg,
  createPluginHelperByAgg,
  bindRef,
  bindReactive
} from 'vue-fn/domain-server'
```

## 4 API Reference

For complete API reference, see the [domain module documentation](./domain). All APIs available in `domain` are also available in `domain-server`.

## 5 Performance Considerations

### 5.1 Memory Management

When using `createMultiInstanceAgg`, remember to call the `destroy()` method to clean up resources:

```typescript
const worker = createMultiInstanceAgg(/* ... */)

try {
  await worker.api.actions.process()
} finally {
  worker.api.destroy() // Clean up resources
}
```

### 5.2 Reactivity Overhead

When using the reactive system on the server, note:

- Avoid creating large numbers of reactive objects in hot paths
- Use `shallowRef` and `shallowReactive` to reduce deep reactivity overhead
- For read-only data, consider using plain objects

```typescript
const agg = createSingletonAgg(() => {
  // Use shallowRef to avoid deep reactivity
  const cache = shallowRef<Map<string, any>>(new Map())

  return {
    states: { cache },
    actions: {
      update(key: string, value: any) {
        const newCache = new Map(cache.value)
        newCache.set(key, value)
        cache.value = newCache // Replace entire reference
      },
    },
  }
})
```

## 6 Comparison with Client Module

| Feature | domain | domain-server |
| --- | --- | --- |
| Environment | Browser/Node.js | Node.js |
| Dependencies | vue | @vue/reactivity |
| View Rendering | Supported | Not supported |
| Bundle Size | Larger | Smaller |
| Use Cases | Client apps | Server apps, APIs, CLI |

If your project:

- Only needs state management, no view rendering → Use `domain-server`
- Needs to run in browser → Use `domain`
- Is pure server project (API, CLI) → Use `domain-server`
