# 主页

这是一个 vue3 的响应式函数工具包，其中包含了多个模块，有利于 TreeShaking 优化（按需加载）。在打包时，也只会打包使用的模块。

## 模块功能说明

### domain

领域驱动设计模块，提供事件、聚合、插件等核心概念的实现。基于 `@vue/reactivity` 构建，当你需要使用 Vue 的响应式功能（无论是带视图渲染还是仅状态管理）时，都可以使用这个模块。

### domain-server

服务端领域模块，功能与 `domain` 模块完全一致，专为 Node.js 环境设计。适用于服务端应用、API 服务等不需要视图渲染的场景。

### shared-domain

跨标签页共享领域模块，基于 BroadcastChannel API 实现跨标签页/窗口的状态共享。提供与 `domain` 相似的 API，支持单例和多实例聚合。

### timer

异步工具模块，提供 `createTimeout()`（可取消的超时计时器）和 `createDeferred()`（Promise 工具）等函数。

## 如何使用

```shell
npm install vue-fn
pnpm add vue-fn
```

```ts
/* 领域模块 */
import {
  createRequestEvent,
  createBroadcastEvent,
  createSingletonAgg,
  createMultiInstanceAgg,
  createPluginHelperByAgg,
  bindRef,
  bindReactive
} from 'vue-fn/domain'

/* 服务端领域模块 */
import {
  createRequestEvent,
  createBroadcastEvent,
  createSingletonAgg,
  createMultiInstanceAgg
} from 'vue-fn/domain-server'

/* 共享领域模块 */
import {
  createLocalEvent,
  createSharedEvent,
  createSharedSingletonAgg,
  createSharedMultiInstanceAgg
} from 'vue-fn/shared-domain'

/* 定时器模块 */
import { createTimeout, createDeferred } from 'vue-fn/timer'
```
