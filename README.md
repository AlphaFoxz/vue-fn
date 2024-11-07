# vue-fn

## 如何使用

```shell
npm install vue-fn
pnpm add vue-fn
```

```ts
import { createEvent, createAgg /* others... */ } from 'vue-fn/domain'
```

## 1 domain 领域模块

### 1.1 createEvent

#### 1.1.1 定义

```typescript
export function createEvent<T extends DomainEventArgs, U extends Function>(data: T, callback?: U): DomainEvent<T, U>
```

创建一个事件，此事件可被触发、可被监听。

T: 声明的时候定义事件属性，为了方便，可以包含响应式数据，但是在触发的时候会有类型校验，需要传入 unref 类型

U: 一个可选的回调函数，可以被监听者执行

#### 1.1.2 示例：事件触发

```typescript
const name = ref('Andy')
let age = 18
const userUpdatedEvent = createEvent({ name, age })

// 监听
const stopWatchHandle = nameUpdatedEvent.watch(({ data, version }) => {
  data.name // Andy
  data.age // 18
  version // 1
})

// 触发
userUpdatedEvent.trigger({ name: name.value, age })
```

#### 1.1.3 示例：事件回调

```typescript
const message = ref('收到请回复')
const messageSentEvent = createEvent({ message }, (reply: string) => {
  console.log(reply)
})

// 监听
const stopWatchHandle = messageSentEvent.watch(({ data, version, callback }) => {
  data.message // '收到请回复'
  version // 1
  callback('收到')
})

// 触发
userUpdatedEvent.trigger({ message: message.value })

// print '收到'
```

### 1.2 toEventApi

将事件转换为 api，使其不包含 trigger 方法

#### 1.2.1 示例

```typescript
const event = createEvent({ name })
const api = toEventApi(event)
// api.trigger === undefined
```

### 1.3 createAgg

创建一个单例聚合，传入初始化函数，按需返回 states、actions、events

此聚合保证了：

1、states 中的属性保持了原有的响应性

2、states 中的属性只读，不可被外部修改

3、外部代码只能通过调用 actions 中的函数来对聚合内产生实质的影响

4、暴露出的事件(events)，都是 API 的形式，不可被外部 trigger

#### 1.3.1 示例

```typescript
const agg = createAgg(() => {
  const name = ref('Andy')
  const age = ref(18)
  const userUpdatedEvent = createEvent({ name, age })
  return {
    states: {
      name,
    },
    actions: {
      setName(n: string) {
        name.value = n
      },
    },
    events: {
      userUpdated: userUpdatedEvent,
    },
  }
})

agg.api.states.name.value = 'Bob' // Error, name is readonly
userUpdated.watch((data) => {
  // 监听事件，实现仓储
  localStorage.setItem(data.name, JSON.stringify({ name: data.name, age: data.age }))
})
//
watch(agg.api.states.name, (name) => {
  // 比如视图需要更灵敏的响应，就可以自行监听states暴露出的字段
  if (name === 'Andy') {
    // do something
  }
})
```

### 1.4 createUnmountableAgg

创建一个可销毁的聚合，在 createAgg 的基础上，使用了 effectScope 将传入的整个函数包裹起来：

1、增加了一个销毁方法(destroy)和一个销毁事件(destroyed)，可以通过调用 api.destroy 方法 触发 destroyed 事件

2、保证了内部的 watch 等副作用会在 destroy 之后清除

3、提供一个 context，如果还有其他非响应式的副作用，可以通过 context.onScopeDispose 处理副作用（与 vuejs 的 onScopeDispose 函数等价）

#### 1.4.1 示例

```typescript
const agg = createUnmountableAgg((context) => {
  const count = ref(1)
  let timer = setInterval(() => {
    count.value += 1
  }, 1000)
  context.onScopeDispose(() => {
    clearInterval(timer)
    timer = undefined
    count.value = -1
  })
  return {
    states: {
      count,
      timer,
    },
  }
})

agg.events.destroyed.watch(() => {
  console.log('agg destroyed')
})

agg.api.destroy()
// print 'agg destroyed'
agg.api.states.count.value // -1
agg.api.states.timer // undefined
```

## 2 timer 计时模块

### 2.1 createTimeout

创建一个超时计时器，支持中途重置、超时执行自定义逻辑

#### 2.1.1 示例：超时报错

```typescript
const { resolve, reset, promise, isTimeout } = createTimeout(50)
isTimeout.value // false
reset(5)
try {
  await promise
} catch (e) {
  e // Error: timeout!
}
```

#### 2.1.1 示例：超时执行自定义逻辑

```typescript
const { resolve, reset, promise, isTimeout } = createTimeout(50, () => {
  console.log('timeout')
})
await promise // print 'timeout'
```
