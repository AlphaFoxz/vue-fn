# domain Module

## 1 Events

### 1.1 createRequestEvent - Request/Reply Event

#### 1.1.1 Definition

```typescript
function createRequestEvent<DATA, REPLY_DATA>() {
  function options(options: {
    dataType?: DATA
    onReply: (replyData: REPLY_DATA) => void
    onError?: (e: Error) => void
    maxListenerCount?: number
    isTerminateOnError?: boolean
    timeoutMs?: number | false
  }): DomainRequestEvent<DATA, REPLY_DATA>
}

type DomainRequestEvent<DATA, REPLY_DATA> = {
  listeners: DomainRequestEventListener<DATA, REPLY_DATA>[]
  publishRequest: (data: DATA) => Promise<REPLY_DATA>
  api: {
    readonly latestVersion: string
    listenAndReply: (replyFn: DomainRequestEventListener<DATA, REPLY_DATA>) => () => void
  }
}

type DomainRequestEventListener<DATA, REPLY_DATA> = (param: {
  readonly data: DATA
  readonly version: string
}) => REPLY_DATA
```

- Creates a Request event supporting request-response pattern with await for listener response
- **options**: Configuration options
  - `dataType`: Define request data type (optional, for type inference)
  - `onReply`: Callback for response data
  - `onError`: Error handling callback
  - `maxListenerCount`: Maximum number of listeners
  - `isTerminateOnError`: Whether to terminate on error
  - `timeoutMs`: Timeout in milliseconds, false means no timeout
- **publishRequest(data)**: Publish request, returns Promise waiting for listener response
- **api.listenAndReply(fn)**: Listen to request and return response, returns unsubscribe function

#### 1.1.2 Example

```typescript
import { createRequestEvent } from 'vue-fn/domain'

// Create request event
const needReply = createRequestEvent<{ message: string }, string>().options({
  onReply: (reply: string) => {
    console.log('Received reply:', reply)
  },
  timeoutMs: 5000, // 5 second timeout
})

// Listen and reply
const unlisten = needReply.listenAndReply(({ data, version }) => {
  data.message // 'Please reply'
  version // '1'
  return 'Received' // Return response data
})

// Publish request
await needReply.publishRequest({ message: 'Please reply' })
// print 'Received reply: Received'

// Unlisten
unlisten()
```

### 1.2 createBroadcastEvent - Broadcast Event

#### 1.2.1 Definition

```typescript
function createBroadcastEvent<DATA>(): DomainBroadcastEvent<DATA>

type DomainBroadcastEvent<DATA> = {
  listeners: DomainBroadcastEventListener<DATA>[]
  publish: (data: DATA) => void
  api: {
    readonly latestVersion: string
    listen: (cb: (event: { data: DATA; version: string }) => void) => () => void
  }
}

type DomainBroadcastEventListener<DATA> = (param: {
  readonly data: DATA
  readonly version: string
}) => void
```

- Creates a broadcast event supporting one-to-many communication pattern
- **publish(data)**: Publish event, notify all listeners
- **api.listen(cb)**: Listen to event, returns unsubscribe function
- **api.latestVersion**: Read-only property, get latest version number

#### 1.2.2 Example

```typescript
import { createBroadcastEvent } from 'vue-fn/domain'

const onUserUpdated = createBroadcastEvent<{ name: string; age: number }>()

// Listen
const unlisten = onUserUpdated.listen(({ data, version }) => {
  data.name // 'Andy'
  data.age // 18
  version // '1'
})

// Publish
onUserUpdated.publish({ name: 'Andy', age: 18 })

// Unlisten
unlisten()
```

## 2 Aggregations

### 2.1 createSingletonAgg

Creates a singleton aggregation, passing initialization function, returns states, actions, events on demand.

This aggregation ensures:

1. **Properties in states maintain their reactivity**
2. **Properties in states are read-only, cannot be modified externally**
3. **External code can only affect aggregation internals by calling functions in actions**
4. **Exposed events are in API form, cannot be published externally**
5. **Context provided in closure allows registering lifecycle hooks at specified times**

#### 2.1.1 Definition

```typescript
function createSingletonAgg<STATES, COMMANDS, EVENTS>(
  init: (context: {
    onCreated: (fn: () => void) => void
    onBeforeInitialize: (fn: () => void) => void
    isInitialized: ComputedRef<boolean>
    untilInitialized: Promise<void>
  }) => {
    states?: STATES
    commands?: COMMANDS
    events?: EVENTS
  }
): DomainSingletonAgg<STATES, COMMANDS, EVENTS>
```

#### 2.1.2 Example

```typescript
import { createSingletonAgg, createRequestEvent, createBroadcastEvent } from 'vue-fn/domain'

const agg = createSingletonAgg((context) => {
  const name = ref('Andy')
  const age = ref(18)

  const needLoadUserInfo = createRequestEvent<{ name: string }, { name: string; age: number }>().options({
    onReply: (data) => {
      if(data.name !== name.value) {
        throw new Error('loadName not match')
      }
      name.value = data.name
      age.value = data.age
    }
  })

  context.onBeforeInitialize(async () => {
    await needLoadUserInfo.publishRequest({ name: name.value })
  })

  const onUserUpdated = createBroadcastEvent<{ name: string; age: number }>()

  return {
    states: {
      name,
    },
    commands: {
      setName(n: string) {
        name.value = n
        onUserUpdated.publish({ name: name.value, age: age.value })
      },
    },
    events: {
      needLoadUserInfo,
      onUserUpdated,
    },
  }
})

// Error: name is read-only
agg.api.states.name.value = 'Bob' // Error

// Listen to load user event and reply with user info
agg.api.events.needLoadUserInfo.listenAndReply(({ data }) => {
  return { name: data.name, age: 18 }
})

// Listen to user update event, implement repository
agg.api.events.onUserUpdated.listen(({ data }) => {
  localStorage.setItem(data.name, JSON.stringify({ name: data.name, age: data.age }))
})

// Listen to state changes
watch(agg.api.states.name, (name) => {
  if (name === 'Andy') {
    // do something
  }
})
```

### 2.2 createMultiInstanceAgg

Creates a destroyable aggregation, wrapping the entire function with effectScope on top of createSingletonAgg:

1. **Adds a destroy method and destroyed event, can trigger destroyed event by calling api.destroy method**
2. **Ensures internal side effects like watch are cleared after destroy**

#### 2.2.1 Definition

```typescript
function createMultiInstanceAgg<STATES, COMMANDS, EVENTS>(
  init: (context: {
    getCurrentScope: () => EffectScope
    onScopeDispose: (fn: () => void, failSilently?: boolean) => void
    onCreated: (fn: () => void) => void
    onBeforeInitialize: (fn: () => void) => void
    isInitialized: ComputedRef<boolean>
    untilInitialized: Promise<void>
  }) => {
    states?: STATES
    commands?: COMMANDS
    events?: EVENTS
    destroy?: () => void
  }
): DomainMultiInstanceAgg<STATES, COMMANDS, EVENTS>
```

#### 2.2.2 Example

```typescript
import { createMultiInstanceAgg } from 'vue-fn/domain'

const agg = createMultiInstanceAgg((context) => {
  const count = ref(1)
  let timer = setInterval(() => {
    count.value += 1
  }, 1000)

  context.onScopeDispose(() => {
    clearInterval(timer)
    timer = undefined
    count.value = -1
  })

  const onDestroyed = createBroadcastEvent<{}>()

  return {
    states: {
      count,
    },
    events: {
      onDestroyed,
    },
    destroy() {
      onDestroyed.publish({})
    },
  }
})

agg.api.events.onDestroyed.listen(() => {
  console.log('agg destroyed')
})

agg.api.destroy()
// print 'agg destroyed'
agg.api.states.count.value // -1
```

## 3 Plugins

### 3.1 createPluginHelperByAgg

Creates a plugin center to extend existing aggregations with unified API.

#### 3.1.1 Definition

```typescript
function createPluginHelperByAgg<AGG>(
  agg: AGG
): DomainPluginHelper<AGG>
```

#### 3.1.2 Example

```typescript
import { createSingletonAgg, createBroadcastEvent, createPluginHelperByAgg } from 'vue-fn/domain'

const agg = createSingletonAgg(() => {
  const name = ref('')
  const onNameChanged = createBroadcastEvent<{ name: string }>()
  return {
    events: {
      onNameChanged,
    },
    states: {
      name
    },
    commands: {
      setName(n: string) {
        name.value = n
        onNameChanged.publish({ name: name.value })
      }
    }
  }
})

// Create a strongly typed plugin center
export const PluginHelper = createPluginHelperByAgg(agg)
// Register aggregation for automatic plugin registration/deregistration
PluginHelper.registerAgg(agg)

// Implement a repository plugin
const STORE_PLUGIN = PluginHelper.createSetupPlugin({
  mount({ api }) {
    api.events.onNameChanged.listen(({ data }) => {
      localStorage.setItem('name', data.name)
    })
  }
})
// Register repository plugin
PluginHelper.registerPlugin(STORE_PLUGIN)

// Implement an alert plugin (hot-swappable)
const ALERT_PLUGIN = PluginHelper.createHotSwapPlugin(() => {
  let handler: (() => void) | undefined = undefined
  return {
    mount() {
      // Listen to event when mounted
      handler = agg.api.events.onNameChanged.listen(({ data }) => {
        alert(data.name)
      })
    },
    unmount() {
      // Release resources when unmounted
      handler?.()
    },
  }
})
// Register alert plugin
PluginHelper.registerPlugin(ALERT_PLUGIN)
// Unregister alert plugin
PluginHelper.unregisterPlugin(ALERT_PLUGIN)
```

### 3.2 createPluginHelperByAggCreator

Creates a plugin center through an aggregation creation function. Can extend existing aggregations with unified API (return value same as `createPluginHelperByAgg`).

## 4 Binding

### 4.1 bindRef

Creates a two-way bound ref with aggregation state, supporting sync and async modes.

#### 4.1.1 Definition

```typescript
function bindRef<STATE, T>(
  aggState: STATE,
  onChange: WatchCallback<T>,
  watchOptions?: WatchOptions & { forceSync?: boolean }
): Ref<T>
```

- **aggState**: State in aggregation (ref or getter function)
- **onChange**: Callback when bound value changes
- **watchOptions**: watch options, supports additional `forceSync` option
  - `forceSync: false` (default): One-way binding, only local changes trigger onChange
  - `forceSync: true`: Two-way sync, aggregation state and local value sync with each other, uses deep equality check to avoid circular updates

#### 4.1.2 Example

```typescript
import { createSingletonAgg, bindRef } from 'vue-fn/domain'

const agg = createSingletonAgg(() => {
  const name = ref('Andy')
  return {
    states: { name },
    commands: {
      setName(n: string) { name.value = n }
    }
  }
})

// One-way binding - local modification triggers onChange
const localName = bindRef(agg.api.states.name, (newName) => {
  console.log('Name changed to:', newName)
})

localName.value = 'Bob' // print 'Name changed to: Bob'

// Two-way sync - aggregation and local value sync with each other
const syncName = bindRef(agg.api.states.name, (newName) => {
  console.log('Synced name:', newName)
}, { forceSync: true })

// Aggregation state changes sync to local
agg.api.commands.setName('Charlie') // localName.value becomes 'Charlie'

// Local changes sync to aggregation (via onChange)
syncName.value = 'David'
```

### 4.2 bindReactive

Creates a two-way bound reactive object with aggregation state, similar to bindRef but for object-type states.

#### 4.2.1 Definition

```typescript
function bindReactive<STATE, T>(
  aggState: STATE,
  onChange: WatchCallback<T>,
  watchOptions?: WatchOptions & { forceSync?: boolean }
): Reactive<T>
```

Parameters and options are the same as `bindRef`, but returns a reactive object instead of ref.

#### 4.2.2 Example

```typescript
import { createSingletonAgg, bindReactive } from 'vue-fn/domain'

const agg = createSingletonAgg(() => {
  const user = reactive({ name: 'Andy', age: 18 })
  return {
    states: { user },
    commands: {
      updateUser(u: { name: string; age: number }) {
        Object.assign(user, u)
      }
    }
  }
})

// Bind reactive object
const localUser = bindReactive(agg.api.states.user, (newUser) => {
  console.log('User updated:', newUser)
})

localUser.name = 'Bob' // print 'User updated: { name: 'Bob', age: 18 }'

// Two-way sync
const syncUser = bindReactive(agg.api.states.user, (newUser) => {
  console.log('Synced user:', newUser)
}, { forceSync: true })
```
