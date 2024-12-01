import { customRef, Ref, shallowRef, ShallowRef, watch } from 'vue'
import { genId } from './common'

type InferSharedRefs<T extends Record<string, any>> = {
  [K in keyof T]: Ref<T[K]>
}

type SharedSyncMessage = {
  t: 'U'
  k: string
  v: any
}

type RequireMessage = {
  t: 'R'
  k: string
}

export function createSharedFactory(channel: BroadcastChannel) {
  const map: Record<string, { data: ShallowRef<any>; trigger: () => void }> = {}
  channel.onmessage = (event) => {
    if (event.data.t === 'U') {
      const syncMessage = event.data as SharedSyncMessage
      if (!map[syncMessage.k]) {
        map[syncMessage.k] = { data: shallowRef(syncMessage.v), trigger: () => {} }
      } else if (map[syncMessage.k].data.value !== syncMessage.v) {
        map[syncMessage.k].data.value = syncMessage.v
      }
    }
    if (event.data.t === 'R') {
      const requireMessage = event.data as RequireMessage
      if (map[requireMessage.k]) {
        channel.postMessage({ t: 'U', k: requireMessage.k, v: map[requireMessage.k].data.value })
      }
    }
  }

  function sharedRef<T>(name: string, value: T) {
    setTimeout(() => channel.postMessage({ t: 'R', k: name }))
    const id = genId(name)
    map[id] = { data: shallowRef(value), trigger: () => {} }
    watch(map[id].data, (n: any, o: any) => {
      if (n !== o) {
        value = n
        map[id].trigger()
      }
    })
    const r = customRef((track, trigger) => {
      return {
        get() {
          track()
          return value
        },
        set(newValue: T) {
          map[id].trigger = trigger
          if (value === newValue) {
            return
          }
          map[id].data.value = newValue
          value = newValue
          channel.postMessage({ t: 'U', k: id, v: newValue })
          trigger()
        },
      }
    })
    r.value = value
    return r
  }

  return {
    // sharedRef,
    sharedRefs: <T extends Record<string, any>>(values: T): InferSharedRefs<T> => {
      const map: Record<string, Ref<any>> = {}
      for (const entry of Object.entries(values)) {
        map[entry[0]] = sharedRef(entry[0], entry[1])
      }
      return map as InferSharedRefs<T>
    },
  }
}

export function createSharedSingletonAgg<
  STATES extends Record<string, Ref<any>>,
  COMMANDS extends Record<string, Function>
>(
  channelName: string,
  init: (context: { sharedRefs: ReturnType<typeof createSharedFactory>['sharedRefs'] }) => {
    states: STATES
    commands: COMMANDS
  }
): { api: { states: STATES; commands: COMMANDS } } {
  const channel = new BroadcastChannel(channelName)
  const sharedFactory = createSharedFactory(channel)
  const result = init({ sharedRefs: sharedFactory.sharedRefs })

  const states = (result.states || {}) as STATES
  const commands = (result.commands || {}) as COMMANDS
  return {
    api: { states, commands },
  }
}
