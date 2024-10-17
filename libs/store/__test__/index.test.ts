import { ref, isReadonly, reactive, watch, onWatcherCleanup } from '@vue/reactivity'
import { describe, expect, it } from '@jest/globals'
import { createApi, createSingletonApi } from '..'

describe('store', () => {
  it('createSingletonApi', () => {
    const a = ref('a')
    const b = reactive({ b1: 'b1', b2: () => {} })
    const c = ref({ c1: ref('c1') })
    const api = createSingletonApi({
      state: {
        a,
        b,
        c,
      },
      action: {
        setA(s: string) {
          a.value = s
        },
      },
    })
    expect(isReadonly(api.state)).toBe(true)
    expect(isReadonly(api.state.a)).toBe(true)
    expect(isReadonly(api.state.b)).toBe(true)
    expect(isReadonly(api.state.c.value)).toBe(true)
    expect(api.state.c.value.c1).toBe('c1')

    expect(isReadonly(api.action)).toBe(true)
    expect(api.state.a.value).toBe('a')
    expect(api.state.b.b1).toBe('b1')
    expect(api.state.b.b2).toBeInstanceOf(Function)
  })

  it('createApi', async () => {
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
        state: {
          a,
          aPlus,
        },
        action: {
          setA: (n: string) => {
            a.value = n
          },
        },
        destory() {
          stop()
        },
      })
    })()

    api.action.setA('a1')
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(api.state.aPlus.value).toBe('a1+')
    api.destory()
    await new Promise((resolve) => setTimeout(resolve, 1))
    api.action.setA('b')
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(api.state.aPlus.value).toBe('a1+')
    await new Promise((resolve) => setTimeout(resolve, 1))
  })
})
