# shared-domain 共享领域模块

基于 BroadcastChannel API 实现跨标签页/窗口的状态共享，提供与 `domain` 模块相似的 API。由于 BroadcastChannel 的通信开销，目前不支持高频操作，建议用于渲染不频繁的场景。

## 1 事件

### 1.1 createLocalEvent - 本地事件

创建一个仅在本地使用的事件，不跨标签页通信。

#### 1.1.1 定义

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

#### 1.1.2 示例

```typescript
const event = createLocalEvent<string>()

// 监听事件
const unlisten = event.api.listen((data) => {
  console.log('Received:', data)
})

// 发布事件
event.publish('Hello')

// 停止监听
unlisten()
```

### 1.2 createSharedEvent - 共享事件

创建一个支持跨标签页通信的事件。

#### 1.2.1 定义

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

- 本地监听者会立即收到通知
- 同时广播到其他标签页
- 通常在 `createSharedSingletonAgg` 或 `createSharedMultiInstanceAgg` 中使用

#### 1.2.2 示例

```typescript
const event = createSharedEvent<{ message: string }>()

// 监听事件
const unlisten = event.api.listen((data) => {
  console.log('Received:', data.message)
})

// 发布事件（本地 + 跨标签页）
event.publish({ message: 'Hello from other tab' })
```

## 2 聚合

### 2.1 createSharedSingletonAgg - 共享单例聚合

创建一个跨标签页共享的单例聚合，所有标签页共享同一状态。

#### 2.1.1 定义

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

- **channelName**: BroadcastChannel 频道名称，相同名称的聚合会共享状态
- **init**: 初始化函数，返回聚合的 states、commands、events
- 返回值包含：
  - `api`: 包含只读的 states、commands、events
  - `isInitialized`: 是否已初始化
  - `untilInitialized`: 等待初始化完成的 Promise

#### 2.1.2 特性

1. **状态同步**: 当新标签页打开时，会自动请求现有状态并同步
2. **命令广播**: 在任何标签页执行的命令会广播到其他标签页
3. **事件共享**: 使用 `createSharedEvent` 创建的事件会跨标签页广播
4. **自动清理**: 关闭标签页时自动清理资源

#### 2.1.3 示例

```typescript
import { createSharedSingletonAgg, createSharedEvent } from 'vue-fn/shared-domain'

const agg = createSharedSingletonAgg(
  'user-prefs', // 频道名称
  ({ onBeforeInitialize, isInitialized, untilInitialized }) => {
    const theme = ref<'light' | 'dark'>('light')
    const language = ref('zh-CN')

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

// 在标签页 A 中设置主题
agg.api.commands.setTheme('dark')

// 在标签页 B 中自动同步
console.log(agg.api.states.theme.value) // 'dark'

// 监听主题变化（跨标签页）
agg.api.events.onThemeChanged.listen(({ theme }) => {
  console.log('Theme changed to:', theme)
})
```

### 2.2 createSharedMultiInstanceAgg - 共享多实例聚合

创建一个支持多实例的共享聚合，每个 ID 的实例状态独立。

#### 2.2.1 定义

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

- **id**: 实例标识符，相同 ID 的实例共享状态
- **channelName**: BroadcastChannel 频道名称
- **init**: 初始化函数，支持 `onScopeDispose` 生命周期钩子

#### 2.2.2 特性

1. **状态隔离**: 不同 ID 的实例状态完全隔离
2. **生命周期管理**: 支持 `destroy()` 方法和 `onScopeDispose` 钩子
3. **销毁广播**: 调用 `destroy()` 会通知其他标签页

#### 2.2.3 示例

```typescript
import { createSharedMultiInstanceAgg } from 'vue-fn/shared-domain'

// 创建用户特定的共享聚合
const userAgg = createSharedMultiInstanceAgg(
  'user-123', // 用户 ID
  'user-state', // 频道名称
  ({ onScopeDispose }) => {
    const profile = ref({ name: '', age: 0 })
    const isActive = ref(true)

    let timer: ReturnType<typeof setInterval>
    timer = setInterval(() => {
      // 模拟心跳
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

// 使用
await userAgg.untilInitialized
userAgg.api.commands.updateProfile('Andy', 18)

// 销毁实例
userAgg.api.destroy()
```

## 3 使用场景

### 3.1 用户偏好设置

```typescript
const prefs = createSharedSingletonAgg('preferences', () => {
  const theme = ref('light')
  const language = ref('zh')

  return {
    states: { theme, language },
    commands: {
      setTheme(t: string) { theme.value = t },
      setLanguage(l: string) { language.value = l },
    },
  }
})

// 在任何标签页修改偏好
prefs.api.commands.setTheme('dark')
// 其他标签页自动同步
```

### 3.2 购物车同步

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

### 3.3 多标签页协作

```typescript
// 每个 ID 代表一个协作会话
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

## 4 限制和注意事项

1. **性能**: BroadcastChannel 通信有开销，不适合高频更新（如每秒多次）
2. **数据大小**: 传输的数据会被序列化，避免传输大型对象
3. **浏览器支持**: 需要浏览器支持 BroadcastChannel API
4. **隐私**: 同源的所有标签页都能接收消息，注意敏感数据
5. **顺序**: 消息到达顺序可能与发送顺序不同，需要处理竞态条件
