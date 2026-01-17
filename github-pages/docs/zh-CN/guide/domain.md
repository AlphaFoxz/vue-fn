# domain 领域模块

## 1 事件

### 1.1 createRequestEvent - Request/Reply 事件

#### 1.1.1 定义

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

- 创建一个 Request 事件，支持请求-响应模式，可以 await 等待监听者的响应
- **options**: 配置选项
  - `dataType`: 定义请求数据的类型（可选，用于类型推导）
  - `onReply`: 响应数据的回调函数
  - `onError`: 错误处理回调
  - `maxListenerCount`: 最大监听者数量限制
  - `isTerminateOnError`: 发生错误时是否终止
  - `timeoutMs`: 超时时间（毫秒），false 表示不超时
- **publishRequest(data)**: 发布请求，返回一个 Promise，等待监听者响应
- **api.listenAndReply(fn)**: 监听请求并返回响应，返回取消监听的函数

#### 1.1.2 示例

```typescript
import { createRequestEvent } from 'vue-fn/domain'

// 创建请求事件
const needReply = createRequestEvent<{ message: string }, string>().options({
  onReply: (reply: string) => {
    console.log('收到回复:', reply)
  },
  timeoutMs: 5000, // 5秒超时
})

// 监听并回复
const unlisten = needReply.listenAndReply(({ data, version }) => {
  data.message // '收到请回复'
  version // '1'
  return '收到' // 返回响应数据
})

// 发布请求
await needReply.publishRequest({ message: '收到请回复' })
// print '收到回复: 收到'

// 取消监听
unlisten()
```

### 1.2 createBroadcastEvent - 广播事件

#### 1.2.1 定义

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

- 创建一个广播事件，支持一对多的通信模式
- **publish(data)**: 发布事件，通知所有监听者
- **api.listen(cb)**: 监听事件，返回取消监听的函数
- **api.latestVersion**: 只读属性，获取最新版本号

#### 1.2.2 示例

```typescript
import { createBroadcastEvent } from 'vue-fn/domain'

const onUserUpdated = createBroadcastEvent<{ name: string; age: number }>()

// 监听
const unlisten = onUserUpdated.listen(({ data, version }) => {
  data.name // 'Andy'
  data.age // 18
  version // '1'
})

// 发布
onUserUpdated.publish({ name: 'Andy', age: 18 })

// 取消监听
unlisten()
```

## 2 聚合

### 2.1 createSingletonAgg

创建一个单例聚合，传入初始化函数，按需返回 states、actions、events

此聚合保证了：

1. **states 中的属性保持了原有的响应性**
2. **states 中的属性只读，不可被外部修改**
3. **外部代码只能通过调用 actions 中的函数来对聚合内产生实质的影响**
4. **暴露出的事件(events)，都是 API 的形式，不可被外部 publish**
5. **闭包中提供 context 上下文，可以利用其中的方法注册钩子函数，实现在指定的生命周期执行相关逻辑**

#### 2.1.1 定义

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

#### 2.1.2 示例

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

// 错误：name 是只读的
agg.api.states.name.value = 'Bob' // Error

// 监听加载用户事件，并回复用户信息
agg.api.events.needLoadUserInfo.listenAndReply(({ data }) => {
  return { name: data.name, age: 18 }
})

// 监听用户更新事件，实现仓储
agg.api.events.onUserUpdated.listen(({ data }) => {
  localStorage.setItem(data.name, JSON.stringify({ name: data.name, age: data.age }))
})

// 监听状态变化
watch(agg.api.states.name, (name) => {
  if (name === 'Andy') {
    // do something
  }
})
```

### 2.2 createMultiInstanceAgg

创建一个可销毁的聚合，在 createSingletonAgg 的基础上，使用了 effectScope 将传入的整个函数包裹起来：

1. **增加了一个销毁方法(destroy)和一个销毁事件(destroyed)，可以通过调用 api.destroy 方法 触发 destroyed 事件**
2. **保证了内部的 watch 等副作用会在 destroy 之后清除**

#### 2.2.1 定义

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

#### 2.2.2 示例

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

## 3 插件

### 3.1 createPluginHelperByAgg

创建一个插件中心，可以对已有的聚合进行拓展，提供统一的 API。

#### 3.1.1 定义

```typescript
function createPluginHelperByAgg<AGG>(
  agg: AGG
): DomainPluginHelper<AGG>
```

#### 3.1.2 示例

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

// 创建一个强类型的插件中心
export const PluginHelper = createPluginHelperByAgg(agg)
// 注册聚合，实现对其他插件的自动注册、自动注销
PluginHelper.registerAgg(agg)

// 实现一个仓储插件
const STORE_PLUGIN = PluginHelper.createSetupPlugin({
  mount({ api }) {
    api.events.onNameChanged.listen(({ data }) => {
      localStorage.setItem('name', data.name)
    })
  }
})
// 注册仓储插件
PluginHelper.registerPlugin(STORE_PLUGIN)

// 实现一个弹窗插件（热插拔）
const ALERT_PLUGIN = PluginHelper.createHotSwapPlugin(() => {
  let handler: (() => void) | undefined = undefined
  return {
    mount() {
      // 挂载的时候监听事件
      handler = agg.api.events.onNameChanged.listen(({ data }) => {
        alert(data.name)
      })
    },
    unmount() {
      // 卸载的时候释放资源
      handler?.()
    },
  }
})
// 注册弹窗插件
PluginHelper.registerPlugin(ALERT_PLUGIN)
// 注销弹窗插件
PluginHelper.unregisterPlugin(ALERT_PLUGIN)
```

### 3.2 createPluginHelperByAggCreator

通过一个创建聚合的函数来创建插件中心。可以对已有的聚合进行拓展，提供统一的 API（返回值同`createPluginHelperByAgg`）。

## 4 绑定

### 4.1 bindRef

创建一个与聚合状态双向绑定的 ref，支持同步模式和异步模式。

#### 4.1.1 定义

```typescript
function bindRef<STATE, T>(
  aggState: STATE,
  onChange: WatchCallback<T>,
  watchOptions?: WatchOptions & { forceSync?: boolean }
): Ref<T>
```

- **aggState**: 聚合中的状态（ref 或 getter 函数）
- **onChange**: 当绑定值变化时的回调函数
- **watchOptions**: watch 选项，支持额外的 `forceSync` 选项
  - `forceSync: false`（默认）: 单向绑定，只有本地的变化会触发 onChange
  - `forceSync: true`: 双向同步，聚合状态和本地值互相同步，使用深度相等检查避免循环更新

#### 4.1.2 示例

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

// 单向绑定 - 本地修改触发 onChange
const localName = bindRef(agg.api.states.name, (newName) => {
  console.log('Name changed to:', newName)
})

localName.value = 'Bob' // print 'Name changed to: Bob'

// 双向同步 - 聚合和本地值互相同步
const syncName = bindRef(agg.api.states.name, (newName) => {
  console.log('Synced name:', newName)
}, { forceSync: true })

// 聚合状态变化会同步到本地
agg.api.commands.setName('Charlie') // localName.value 变为 'Charlie'

// 本地变化会同步到聚合（通过 onChange）
syncName.value = 'David'
```

### 4.2 bindReactive

创建一个与聚合状态双向绑定的 reactive 对象，功能与 bindRef 类似，但用于对象类型的状态。

#### 4.2.1 定义

```typescript
function bindReactive<STATE, T>(
  aggState: STATE,
  onChange: WatchCallback<T>,
  watchOptions?: WatchOptions & { forceSync?: boolean }
): Reactive<T>
```

参数和选项与 `bindRef` 相同，但返回一个 reactive 对象而不是 ref。

#### 4.2.2 示例

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

// 绑定 reactive 对象
const localUser = bindReactive(agg.api.states.user, (newUser) => {
  console.log('User updated:', newUser)
})

localUser.name = 'Bob' // print 'User updated: { name: 'Bob', age: 18 }'

// 双向同步
const syncUser = bindReactive(agg.api.states.user, (newUser) => {
  console.log('Synced user:', newUser)
}, { forceSync: true })
```
