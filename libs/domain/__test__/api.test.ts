import {
  ref,
  isReadonly,
  reactive,
  watch,
  onWatcherCleanup,
  computed,
  readonly,
  shallowRef,
  shallowReactive,
} from '@vue/reactivity'
import { watchEffect } from 'vue'
import { expect, it } from '@jest/globals'
import { createApi, createSingletonApi } from '..'

it('createSingletonApi 属性只读', () => {
  const api = (function () {
    const a = ref('a')
    const b = reactive({ b1: 'b1', b2: () => {} })
    const c = ref({ c1: ref('c1') })
    const d = computed(() => 'd1')
    return createSingletonApi({
      states: {
        a,
        b,
        c,
        d,
      },
      actions: {
        setA(s: string) {
          a.value = s
        },
      },
    })
  })()
  expect(isReadonly(api.states)).toBe(true)
  expect(isReadonly(api.states.a)).toBe(true)
  expect(isReadonly(api.states.b)).toBe(true)
  expect(isReadonly(api.states.c.value)).toBe(true)
  expect(api.states.c.value.c1).toBe('c1')
  expect(api.states.d.value).toBe('d1')

  expect(isReadonly(api.actions)).toBe(true)
  expect(api.states.a.value).toBe('a')
  expect(api.states.b.b1).toBe('b1')
  expect(api.states.b.b2).toBeInstanceOf(Function)
})

it('createApi 响应式', async () => {
  const a = reactive({ a: 1 })
  const da = readonly(a)
  da

  const api = (function () {
    const x1 = reactive({ inner: 1 })
    const x2 = ref(1)
    const x = reactive({ content: { x1, x2 } })
    const y1 = reactive({ inner: 1 })
    const y2 = ref(1)
    const y = ref({ content: { y1, y2 } })
    const z1 = reactive({ inner: 1 })
    const z2 = ref(1)
    const z = shallowReactive({ content: { z1, z2 } })
    return createSingletonApi({
      states: {
        x,
        y,
        z,
      },
      actions: {
        setX1(n: number) {
          x.content.x1.inner = n
        },
        setX2(n: number) {
          x.content.x2 = n
        },
        selfXpp() {
          x1.inner++
          x2.value++
        },
        setY1(n: number) {
          y.value.content.y1.inner = n
        },
        setY2(n: number) {
          y.value.content.y2 = n
        },
        selfYpp() {
          y1.inner++
          y2.value++
        },
        setZ1(n: number) {
          z.content.z1.inner = n
        },
        setZ2(n: number) {
          z.content.z2.value = n
        },
        selfZpp() {
          z1.inner++
          z2.value++
        },
      },
    })
  })()

  const dx1 = ref(0)
  const dx2 = ref(0)
  const dy1 = ref(0)
  const dy2 = ref(0)
  const dz1 = ref(0)
  const dz2 = ref(0)
  watchEffect(() => {
    dx1.value = api.states.x.content.x1.inner
    dx2.value = api.states.x.content.x2
    dy1.value = api.states.y.value.content.y1.inner
    dy2.value = api.states.y.value.content.y2
    dz1.value = api.states.z.content.z1.inner
    dz2.value = api.states.z.content.z2.value
  })
  api.actions.setX1(2)
  api.actions.setX2(2)
  api.actions.setY1(2)
  api.actions.setY2(2)
  api.actions.setZ1(2)
  api.actions.setZ2(2)
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(dx1.value).toBe(2)
  expect(dx2.value).toBe(2)
  expect(dy1.value).toBe(2)
  expect(dy2.value).toBe(2)
  expect(dz1.value).toBe(2)
  expect(dz2.value).toBe(undefined)
  api.actions.selfXpp()
  api.actions.selfYpp()
  api.actions.selfZpp()
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(dx1.value).toBe(3)
  expect(dx2.value).toBe(3)
  expect(dy1.value).toBe(3)
  expect(dy2.value).toBe(3)
  expect(dz1.value).toBe(3)
  expect(dz2.value).toBe(undefined)
})

it('createApi watcher副作用处理', async () => {
  const api = (function () {
    const a = ref('a')
    const aPlus = ref('a+')
    const isWatching = ref(true)
    const { stop } = watch(a, async (n: string) => {
      onWatcherCleanup(() => {
        isWatching.value = false
      })
      if (isWatching.value) {
        if (n.startsWith('a')) {
          aPlus.value = n + '+'
        } else {
          throw new Error('not a**')
        }
      }
    })
    return createApi({
      states: {
        a,
        aPlus,
      },
      actions: {
        setA: (n: string) => {
          a.value = n
        },
      },
      destory() {
        stop()
      },
    })
  })()

  api.actions.setA('a1')
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(api.states.aPlus.value).toBe('a1+')
  api.destory()
  await new Promise((resolve) => setTimeout(resolve, 1))
  api.actions.setA('b')
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(api.states.aPlus.value).toBe('a1+')
  await new Promise((resolve) => setTimeout(resolve, 1))
})
