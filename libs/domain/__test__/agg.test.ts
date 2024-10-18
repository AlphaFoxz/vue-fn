import { expect, it } from '@jest/globals'
import { createSingletonAgg, createAgg } from '..'
import { type UnwrapRef, isReadonly, ref, shallowRef, triggerRef, watch } from '@vue/reactivity'

it('createSingletonAgg 基本成员变量数值验证', () => {
  const agg = createSingletonAgg(() => {
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

it('createSingletonAgg 触发器检查', async () => {
  const agg = createSingletonAgg(() => {
    const name = ref('')
    const onSave = shallowRef({ name })
    function setName(n: string) {
      name.value = n
      triggerRef(onSave)
    }
    return {
      states: {
        name,
      },
      actions: {
        setName,
      },
      triggers: {
        onSave,
      },
    }
  })

  const saved = ref(false)
  watch(agg.triggers.onSave, (data: UnwrapRef<typeof agg.triggers.onSave>) => {
    expect(data.name.value).toBe('bob')
    saved.value = true
  })
  agg.api.actions.setName('bob')
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(saved.value).toBe(true)
})

it('createAgg', () => {
  const agg = createAgg((context) => {
    const a = ref('a')
    context.defineEffect(watch(a, () => {}))
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
