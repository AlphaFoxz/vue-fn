import { describe, expect, it } from '@jest/globals'
import { createAgg, createAggApi, createUnmountableAgg, createUnmountableAggApi } from '..'
import { computed, isReadonly, onWatcherCleanup, reactive, ref, shallowReactive, watch } from '@vue/reactivity'
import { watchEffect } from 'vue'

describe('测试AggApi', () => {
  it('createAggApi 属性只读', () => {
    const api = (function () {
      const a = ref('a')
      const b = reactive({ b1: 'b1', b2: () => {} })
      const c = ref({ c1: ref('c1') })
      const d = computed(() => 'd1')
      return createAggApi({
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

  it('createAggApi 响应式', async () => {
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
      return createAggApi({
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

  it('createUnmountableAgg destory副作用处理', async () => {
    let clearFlag = false
    const agg = createUnmountableAgg((context) => {
      const a = ref('a')
      const aPlus = ref('')
      watchEffect(() => {
        aPlus.value = a.value + '+'
      })
      context.onScopeDispose(() => {
        clearFlag = true
      })
      return {
        states: { a, aPlus },
        actions: {
          setA(n: string) {
            a.value = n
          },
        },
      }
    })

    agg.api.actions.setA('a1')
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(agg.api.states.aPlus.value).toBe('a1+')
    agg.api.destroy()
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(clearFlag).toBe(true)
    agg.api.actions.setA('b')
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(agg.api.states.aPlus.value).toBe('a1+')
  })

  it('createUnmountableAggApi watcher副作用处理', async () => {
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
      return createUnmountableAggApi({
        states: {
          a,
          aPlus,
        },
        actions: {
          setA: (n: string) => {
            a.value = n
          },
        },
        destroy() {
          stop()
        },
      })
    })()

    api.actions.setA('a1')
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(api.states.aPlus.value).toBe('a1+')
    api.destroy()
    await new Promise((resolve) => setTimeout(resolve, 1))
    api.actions.setA('b')
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(api.states.aPlus.value).toBe('a1+')
    await new Promise((resolve) => setTimeout(resolve, 1))
  })
})

describe('', () => {
  it('createAgg 基本成员变量数值验证', () => {
    const agg = createAgg(() => {
      return {
        states: {
          a: ref('a'),
        },
        actions: {
          log() {
            console.log('log')
          },
        },
      }
    })
    expect(isReadonly(agg.api.states.a)).toBe(true)
    expect(agg.api.actions.log).toBeInstanceOf(Function)
  })

  it('createUnmountableAgg', () => {
    const agg = createUnmountableAgg(() => {
      const a = ref('a')
      watch(a, () => {})
      return {
        states: {
          a,
        },
        actions: {
          setA(n: string) {
            a.value = n
          },
        },
      }
    })
    expect(isReadonly(agg.api.states.a)).toBe(true)
    expect(agg.api.actions.setA).toBeInstanceOf(Function)
  })

  it('createAggApi 属性只读', () => {
    const api = (function () {
      const a = ref('a')
      const b = reactive({ b1: 'b1', b2: () => {} })
      const c = ref({ c1: ref('c1') })
      const d = computed(() => 'd1')
      return createAggApi({
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

  it('createAggApi 响应式', async () => {
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
      return createAggApi({
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

  it('createUnmountableAggApi watcher副作用处理', async () => {
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
      return createUnmountableAggApi({
        states: {
          a,
          aPlus,
        },
        actions: {
          setA: (n: string) => {
            a.value = n
          },
        },
        destroy() {
          stop()
        },
      })
    })()

    api.actions.setA('a1')
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(api.states.aPlus.value).toBe('a1+')
    api.destroy()
    await new Promise((resolve) => setTimeout(resolve, 1))
    api.actions.setA('b')
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(api.states.aPlus.value).toBe('a1+')
    await new Promise((resolve) => setTimeout(resolve, 1))
  })
})
