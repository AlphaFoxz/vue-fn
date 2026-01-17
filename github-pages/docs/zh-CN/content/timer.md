# timer 计时模块

## 1 createTimeout

创建一个超时计时器，支持中途重置、超时执行自定义逻辑。

### 1.1 定义

```typescript
function createTimeout(
  timeoutMs: number,
  onTimeout?: Error | (() => void)
): TimeoutApi

type TimeoutApi = {
  resolve: () => void
  reset: (ms?: number) => void
  isTimeout: ShallowRef<boolean>
  promise: Promise<void>
}
```

- **timeoutMs**: 超时时间（毫秒）
- **onTimeout**: 超时时的处理，可以是一个 Error（会 reject）或一个回调函数（会执行后 resolve）
- **resolve**: 手动完成 Promise（取消超时）
- **reset**: 重置超时计时器，可指定新的超时时间
- **isTimeout**: 响应式状态，表示是否已超时
- **promise**: 可以 await 的 Promise

### 1.2 示例

#### 1.2.1 超时报错

```typescript
const { resolve, reset, promise, isTimeout } = createTimeout(50)

isTimeout.value // false

reset(5) // 重置为 5ms

try {
  await promise
} catch (e) {
  e // Error: timeout!
}
```

#### 1.2.2 超时执行自定义逻辑

```typescript
const { resolve, reset, promise, isTimeout } = createTimeout(50, () => {
  console.log('timeout')
})

await promise // print 'timeout'
```

#### 1.2.3 手动完成

```typescript
const { resolve, promise } = createTimeout(5000)

// 在超时前手动完成
resolve()
await promise // 正常完成，不会报错
```

#### 1.2.4 实际应用：请求超时

```typescript
async function fetchWithTimeout(url: string, timeoutMs: number) {
  const { resolve, promise: timeoutPromise } = createTimeout(timeoutMs)

  try {
    const data = await Promise.race([
      fetch(url),
      timeoutPromise
    ])
    resolve() // 取消超时
    return data
  } catch (e) {
    if (e.message === 'timeout!') {
      throw new Error('Request timeout')
    }
    throw e
  }
}
```

## 2 createDeferred

创建一个可手动控制的 Promise，用于异步协调。

### 2.1 定义

```typescript
function createDeferred<T = unknown, E = Error>(): Deferred<T, E>

type Deferred<T, E> = {
  promise: Promise<T>
  resolve: (data?: T) => void
  reject: (cause?: E) => void
}
```

- **promise**: 可以 await 的 Promise
- **resolve**: 手动 resolve Promise
- **reject**: 手动 reject Promise
- **T**: Promise 成功时的数据类型
- **E**: Promise 失败时的错误类型

### 2.2 示例

#### 2.2.1 基本使用

```typescript
const { promise, resolve, reject } = createDeferred<string>()

// 在其他地方 resolve
setTimeout(() => {
  resolve('Hello')
}, 1000)

const result = await promise // 'Hello'
```

#### 2.2.2 条件等待

```typescript
function waitForCondition(condition: () => boolean) {
  const { promise, resolve } = createDeferred()

  const interval = setInterval(() => {
    if (condition()) {
      clearInterval(interval)
      resolve()
    }
  }, 100)

  return promise
}

// 使用
await waitForCondition(() => document.readyState === 'complete')
```

#### 2.2.3 跨模块协调

```typescript
// 模块 A
export const { promise: readyPromise, resolve: markReady } = createDeferred()

// 模块 B
import { readyPromise } from './module-a'

export async function init() {
  await readyPromise
  console.log('Module A is ready')
}
```

#### 2.2.4 带类型的 Deferred

```typescript
interface UserData {
  name: string
  age: number
}

const { promise, resolve } = createDeferred<UserData>()

// TypeScript 知道 resolve 的参数类型
resolve({ name: 'Andy', age: 18 })

const user = await promise
// user 的类型是 UserData
```
