import { customRef, Ref, shallowRef, ShallowRef, watch } from 'vue'
import { genId } from './common'

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
  const map: Record<string, ShallowRef<any>> = {}
  channel.onmessage = (event) => {
    if (event.data.t === 'U') {
      const syncMessage = event.data as SharedSyncMessage
      if (!map[syncMessage.k]) {
        map[syncMessage.k] = shallowRef(syncMessage.v)
      } else if (map[syncMessage.k].value !== syncMessage.v) {
        map[syncMessage.k].value = syncMessage.v
      }
    }
    if (event.data.t === 'R') {
      const requireMessage = event.data as RequireMessage
      if (map[requireMessage.k]) {
        channel.postMessage({ t: 'U', k: requireMessage.k, v: map[requireMessage.k].value })
      }
    }
  }
  return {
    sharedRef: <T>(name: string, value: T) => {
      setTimeout(() => channel.postMessage({ t: 'R', k: name }), 1)
      const id = genId(name)
      map[id] = shallowRef(value)
      let tri: () => void = () => {}
      watch(map[id], (n: any, o: any) => {
        if (n !== o) {
          value = n
          tri()
          // channel.postMessage({ t: 'U', k: id, v: n })
        }
      })
      return customRef((track, trigger) => {
        return {
          get() {
            track()
            return value
          },
          set(newValue: T) {
            map[id].value = newValue
            value = newValue
            tri = trigger
            channel.postMessage({ t: 'U', k: id, v: newValue })
            trigger()
          },
        }
      })
    },
  }
}

export function createSharedSingletonAgg<
  STATES extends Record<string, Ref<any>>,
  ACTIONS extends Record<string, Function>
>(
  channelName: string,
  init: (context: { sharedRef: ReturnType<typeof createSharedFactory>['sharedRef'] }) => {
    states: STATES
    actions: ACTIONS
  }
): { api: { states: STATES; actions: ACTIONS } } {
  const channel = new BroadcastChannel(channelName)
  const sharedFactory = createSharedFactory(channel)
  const result = init({ sharedRef: sharedFactory.sharedRef })

  const states = (result.states || {}) as STATES
  const actions = (result.actions || {}) as ACTIONS
  return {
    api: { states, actions },
  }
}
