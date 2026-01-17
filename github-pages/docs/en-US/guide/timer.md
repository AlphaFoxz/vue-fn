# timer Module

## 1 createTimeout

Creates a timeout timer supporting mid-process reset and custom timeout logic.

### 1.1 Definition

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

- **timeoutMs**: Timeout duration (milliseconds)
- **onTimeout**: Timeout handling, can be an Error (will reject) or a callback function (will execute then resolve)
- **resolve**: Manually complete Promise (cancel timeout)
- **reset**: Reset timeout timer, can specify new timeout duration
- **isTimeout**: Reactive state indicating whether timeout occurred
- **promise**: Awaitable Promise

### 1.2 Examples

#### 1.2.1 Timeout with Error

```typescript
const { resolve, reset, promise, isTimeout } = createTimeout(50)

isTimeout.value // false

reset(5) // Reset to 5ms

try {
  await promise
} catch (e) {
  e // Error: timeout!
}
```

#### 1.2.2 Timeout with Custom Logic

```typescript
const { resolve, reset, promise, isTimeout } = createTimeout(50, () => {
  console.log('timeout')
})

await promise // print 'timeout'
```

#### 1.2.3 Manual Completion

```typescript
const { resolve, promise } = createTimeout(5000)

// Manually complete before timeout
resolve()
await promise // Completes normally, no error
```

#### 1.2.4 Practical Application: Request Timeout

```typescript
async function fetchWithTimeout(url: string, timeoutMs: number) {
  const { resolve, promise: timeoutPromise } = createTimeout(timeoutMs)

  try {
    const data = await Promise.race([
      fetch(url),
      timeoutPromise
    ])
    resolve() // Cancel timeout
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

Creates a manually controlled Promise for async coordination.

### 2.1 Definition

```typescript
function createDeferred<T = unknown, E = Error>(): Deferred<T, E>

type Deferred<T, E> = {
  promise: Promise<T>
  resolve: (data?: T) => void
  reject: (cause?: E) => void
}
```

- **promise**: Awaitable Promise
- **resolve**: Manually resolve Promise
- **reject**: Manually reject Promise
- **T**: Data type when Promise succeeds
- **E**: Error type when Promise fails

### 2.2 Examples

#### 2.2.1 Basic Usage

```typescript
const { promise, resolve, reject } = createDeferred<string>()

// Resolve elsewhere
setTimeout(() => {
  resolve('Hello')
}, 1000)

const result = await promise // 'Hello'
```

#### 2.2.2 Conditional Waiting

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

// Use
await waitForCondition(() => document.readyState === 'complete')
```

#### 2.2.3 Cross-Module Coordination

```typescript
// Module A
export const { promise: readyPromise, resolve: markReady } = createDeferred()

// Module B
import { readyPromise } from './module-a'

export async function init() {
  await readyPromise
  console.log('Module A is ready')
}
```

#### 2.2.4 Typed Deferred

```typescript
interface UserData {
  name: string
  age: number
}

const { promise, resolve } = createDeferred<UserData>()

// TypeScript knows resolve parameter type
resolve({ name: 'Andy', age: 18 })

const user = await promise
// user type is UserData
```
