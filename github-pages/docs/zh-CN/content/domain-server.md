# domain-server 服务端领域模块

服务端领域模块，功能与 [domain 模块](./domain) 完全一致，专为 Node.js 环境设计和优化。

## 1 与 domain 模块的区别

### 1.1 相同点

- 完全相同的 API 和功能
- 相同的事件系统（`createRequestEvent`、`createBroadcastEvent`）
- 相同的聚合系统（`createSingletonAgg`、`createMultiInstanceAgg`）
- 相同的插件系统（`createPluginHelperByAgg`、`createPluginHelperByAggCreator`）
- 相同的绑定工具（`bindRef`、`bindReactive`）

### 1.2 不同点

- **环境**: `domain-server` 专为 Node.js 环境设计，不依赖 Vue 的组件渲染功能
- **依赖**: 使用 `@vue/reactivity` 而非完整的 `vue` 包
- **用途**: 适用于服务端应用、API 服务、CLI 工具等不需要视图渲染的场景

## 2 使用场景

### 2.1 Node.js API 服务

```typescript
import { createSingletonAgg, createBroadcastEvent } from 'vue-fn/domain-server'

// 用户状态管理
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

// 在 API 路由中使用
app.post('/users/:id', (req, res) => {
  userAgg.api.actions.addUser(req.params.id, req.body)
  res.json({ success: true })
})
```

### 2.2 CLI 工具状态管理

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

// 在 CLI 命令中使用
cliState.api.actions.setConfig(loadConfig())
if (cliState.api.states.isVerbose.value) {
  console.log('Verbose mode enabled')
}
```

### 2.3 后台任务处理

```typescript
import { createMultiInstanceAgg } from 'vue-fn/domain-server'

const taskWorker = createMultiInstanceAgg((ctx) => {
  const isRunning = ref(false)
  const progress = ref(0)

  ctx.onScopeDispose(() => {
    // 清理资源
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

// 启动任务
await taskWorker.api.actions.start()
```

### 2.4 微服务间通信

```typescript
import { createRequestEvent, createSingletonAgg } from 'vue-fn/domain-server'

const serviceAgg = createSingletonAgg(() => {
  // 创建请求事件，用于服务间调用
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

// 在其他服务中请求数据
const data = await serviceAgg.api.events.getDataRequest.publishRequest({
  id: '123',
})
```

## 3 安装和使用

### 3.1 安装

```bash
npm install vue-fn
# 或
pnpm add vue-fn
```

### 3.2 导入

```typescript
// 服务端领域模块
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

## 4 API 参考

完整的 API 参考请参考 [domain 模块文档](./domain)，所有 API 在 `domain-server` 中都可用的。

## 5 性能考虑

### 5.1 内存管理

使用 `createMultiInstanceAgg` 时，记得调用 `destroy()` 方法清理资源：

```typescript
const worker = createMultiInstanceAgg(/* ... */)

try {
  await worker.api.actions.process()
} finally {
  worker.api.destroy() // 清理资源
}
```

### 5.2 响应式开销

在服务端使用响应式系统时，注意：

- 避免在热路径上创建大量响应式对象
- 使用 `shallowRef` 和 `shallowReactive` 减少深度响应式的开销
- 对于只读数据，考虑使用普通对象

```typescript
const agg = createSingletonAgg(() => {
  // 使用 shallowRef 避免深度响应式
  const cache = shallowRef<Map<string, any>>(new Map())

  return {
    states: { cache },
    actions: {
      update(key: string, value: any) {
        const newCache = new Map(cache.value)
        newCache.set(key, value)
        cache.value = newCache // 替换整个引用
      },
    },
  }
})
```

## 6 与客户端模块的对比

| 特性 | domain | domain-server |
| --- | --- | --- |
| 环境 | 浏览器/Node.js | Node.js |
| 依赖 | @vue/reactivity | @vue/reactivity |
| 视图渲染 | 支持 | 不支持 |
| 包大小 | 较大 | 较小 |
| 使用场景 | 客户端应用 | 服务端应用、API、CLI |

如果你的项目：

- 只需要状态管理，不需要视图渲染 → 使用 `domain-server`
- 需要在浏览器中使用 → 使用 `domain`
- 是纯服务端项目（API、CLI） → 使用 `domain-server`
