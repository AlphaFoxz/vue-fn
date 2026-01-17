# shared-domain Module

Cross-tab/window state sharing based on BroadcastChannel API, providing similar APIs to the `domain` module. Due to BroadcastChannel communication overhead, high-frequency operations are not currently supported; recommended for infrequently rendering scenarios.

## 1 Events

### 1.1 createLocalEvent - Local Event

Creates an event for local use only, without cross-tab communication.

#### 1.1.1 Definition

```typescript
function createLocalEvent<DATA>(): LocalEvent<DATA>

type LocalEvent<DATA> = {
  listeners: Set<(data: DATA) => void>
  publish: (data: DATA) => void
  api: {
    listen: (callback: (data: DATA) => void) => () => void
  }
}
```

#### 1.1.2 Example

```typescript
const event = createLocalEvent<string>()

// Listen to event
const unlisten = event.api.listen((data) => {
  console.log('Received:', data)
})

// Publish event
event.publish('Hello')

// Stop listening
unlisten()
```

### 1.2 createSharedEvent - Shared Event

Creates an event supporting cross-tab communication.

#### 1.2.1 Definition

```typescript
function createSharedEvent<DATA>(): SharedEvent<DATA>

type SharedEvent<DATA> = {
  listeners: Set<(data: DATA) => void>
  publish: (data: DATA) => void
  api: {
    listen: (callback: (data: DATA) => void) => () => void
  }
  __internal__: {
    setBroadcastFunction: (fn: (data: DATA) => void) => void
  }
}
```

- Local listeners receive notification immediately
- Also broadcasts to other tabs
- Typically used within `createSharedSingletonAgg` or `createSharedMultiInstanceAgg`

#### 1.2.2 Example

```typescript
const event = createSharedEvent<{ message: string }>()

// Listen to event
const unlisten = event.api.listen((data) => {
  console.log('Received:', data.message)
})

// Publish event (local + cross-tab)
event.publish({ message: 'Hello from other tab' })
```

## 2 Aggregations

### 2.1 createSharedSingletonAgg - Shared Singleton Aggregation

Creates a cross-tab shared singleton aggregation where all tabs share the same state.

#### 2.1.1 Definition

```typescript
function createSharedSingletonAgg<
  STATES extends SharedStateRecords<any>,
  COMMANDS extends SharedCommandRecords<any>,
  EVENTS extends SharedEventRecords<any>
>(
  channelName: string,
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
): SharedSingletonAgg<STATES, COMMANDS, EVENTS>
```

- **channelName**: BroadcastChannel channel name, aggregations with same name share state
- **init**: Initialization function returning aggregation's states, commands, events
- Returns:
  - `api`: Contains read-only states, commands, events
  - `isInitialized`: Whether initialized
  - `untilInitialized`: Promise waiting for initialization completion

#### 2.1.2 Features

1. **State Synchronization**: New tabs automatically request and synchronize existing state when opened
2. **Command Broadcasting**: Commands executed in any tab are broadcast to other tabs
3. **Event Sharing**: Events created with `createSharedEvent` are broadcast across tabs
4. **Auto Cleanup**: Resources automatically cleaned up when tabs are closed

#### 2.1.3 Example

```typescript
import { createSharedSingletonAgg, createSharedEvent } from 'vue-fn/shared-domain'

const agg = createSharedSingletonAgg(
  'user-prefs', // Channel name
  ({ onBeforeInitialize, isInitialized, untilInitialized }) => {
    const theme = ref<'light' | 'dark'>('light')
    const language = ref('en')

    const onThemeChanged = createSharedEvent<{ theme: 'light' | 'dark' }>()

    onBeforeInitialize(async () => {
      await untilInitialized
      console.log('Shared agg initialized')
    })

    return {
      states: {
        theme,
        language,
      },
      commands: {
        setTheme(t: 'light' | 'dark') {
          theme.value = t
          onThemeChanged.publish({ theme: t })
        },
        setLanguage(lang: string) {
          language.value = lang
        },
      },
      events: {
        onThemeChanged,
      },
    }
  }
)

// Set theme in tab A
agg.api.commands.setTheme('dark')

// Automatically sync in tab B
console.log(agg.api.states.theme.value) // 'dark'

// Listen to theme changes (cross-tab)
agg.api.events.onThemeChanged.listen(({ theme }) => {
  console.log('Theme changed to:', theme)
})
```

### 2.2 createSharedMultiInstanceAgg - Shared Multi-Instance Aggregation

Creates a shared aggregation supporting multiple instances, where each ID's instance state is independent.

#### 2.2.1 Definition

```typescript
function createSharedMultiInstanceAgg<
  ID,
  STATES extends SharedStateRecords<any>,
  COMMANDS extends SharedCommandRecords<any>,
  EVENTS extends SharedEventRecords<any>
>(
  id: ID,
  channelName: string,
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
): SharedMultiInstanceAgg<ID, STATES, COMMANDS, EVENTS>
```

- **id**: Instance identifier, instances with same ID share state
- **channelName**: BroadcastChannel channel name
- **init**: Initialization function, supports `onScopeDispose` lifecycle hook

#### 2.2.2 Features

1. **State Isolation**: Instances with different IDs have completely isolated states
2. **Lifecycle Management**: Supports `destroy()` method and `onScopeDispose` hook
3. **Destroy Broadcasting**: Calling `destroy()` notifies other tabs

#### 2.2.3 Example

```typescript
import { createSharedMultiInstanceAgg } from 'vue-fn/shared-domain'

// Create user-specific shared aggregation
const userAgg = createSharedMultiInstanceAgg(
  'user-123', // User ID
  'user-state', // Channel name
  ({ onScopeDispose }) => {
    const profile = ref({ name: '', age: 0 })
    const isActive = ref(true)

    let timer: ReturnType<typeof setInterval>
    timer = setInterval(() => {
      // Simulate heartbeat
    }, 30000)

    onScopeDispose(() => {
      clearInterval(timer)
    })

    return {
      states: {
        profile,
        isActive,
      },
      commands: {
        updateProfile(name: string, age: number) {
          profile.value = { name, age }
        },
        deactivate() {
          isActive.value = false
        },
      },
      events: {},
    }
  }
)

// Use
await userAgg.untilInitialized
userAgg.api.commands.updateProfile('Andy', 18)

// Destroy instance
userAgg.api.destroy()
```

## 3 Use Cases

### 3.1 User Preferences

```typescript
const prefs = createSharedSingletonAgg('preferences', () => {
  const theme = ref('light')
  const language = ref('en')

  return {
    states: { theme, language },
    commands: {
      setTheme(t: string) { theme.value = t },
      setLanguage(l: string) { language.value = l },
    },
  }
})

// Modify preferences in any tab
prefs.api.commands.setTheme('dark')
// Other tabs auto sync
```

### 3.2 Shopping Cart Sync

```typescript
const cart = createSharedSingletonAgg('shopping-cart', () => {
  const items = ref<CartItem[]>([])
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price, 0)
  )

  return {
    states: { items, total },
    commands: {
      addItem(item: CartItem) {
        items.value.push(item)
      },
      removeItem(id: string) {
        items.value = items.value.filter(i => i.id !== id)
      },
    },
  }
})
```

### 3.3 Multi-Tab Collaboration

```typescript
// Each ID represents a collaboration session
const session = createSharedMultiInstanceAgg(
  sessionId,
  'collaboration',
  () => {
    const cursors = ref<Map<string, { x: number; y: number }>>(new Map())
    const selections = ref<Selection[]>([])

    return {
      states: { cursors, selections },
      commands: {
        updateCursor(userId: string, pos: { x: number; y: number }) {
          cursors.value.set(userId, pos)
        },
      },
    }
  }
)
```

## 4 Limitations and Considerations

1. **Performance**: BroadcastChannel communication has overhead, not suitable for high-frequency updates (e.g., multiple times per second)
2. **Data Size**: Transmitted data is serialized, avoid transmitting large objects
3. **Browser Support**: Requires browser support for BroadcastChannel API
4. **Privacy**: All same-origin tabs can receive messages, be careful with sensitive data
5. **Order**: Message arrival order may differ from send order, handle race conditions
