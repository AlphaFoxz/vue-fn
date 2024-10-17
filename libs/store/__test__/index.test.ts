import { ref } from '@vue/reactivity'
import { describe, expect, it } from '@jest/globals'
import { defineApi } from '..'

describe('store', () => {
  it('defineApi', () => {
    expect(defineApi).toBeInstanceOf(Function)
    const x = ref(0)
    const api = defineApi({
      state: {
        x,
      },
      action: {
        setX(n: number) {
          x.value = n
        },
      },
    })
    expect(api.state.x.value).toBe(0)
  })
})
