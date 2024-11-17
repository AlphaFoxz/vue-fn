import { customRef, shallowRef, ShallowRef, watch } from 'vue'
import { genId } from './common'

type SharedSyncMessage = {
  t: 'U'
  k: string
  v: any
}

export function createSharedFactory(channel: BroadcastChannel) {
  const map: Record<string, ShallowRef<any>> = {}
  channel.onmessage = (event) => {
    if (event.data.t === 'U') {
      const syncMessage = event.data as SharedSyncMessage
      map[syncMessage.k].value = syncMessage.v
    }
  }
  return {
    sharedRef: <T>(name: string, value: T) => {
      const id = genId(name)
      map[id] = shallowRef(value)
      let tri: () => void = () => {}
      watch(map[id], (n: any, o: any) => {
        if (n !== o) {
          value = n
          tri()
          channel.postMessage({ t: 'U', k: id, v: n })
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
            trigger()
          },
        }
      })
    },
  }
}

export function createSharedSingletonAgg(
  channelName: string,
  init: (context: { sharedRef: ReturnType<typeof createSharedFactory>['sharedRef'] }) => {
    states: Record<string, object>
    actions: Record<string, Function>
  }
) {
  const channel = new BroadcastChannel(channelName)
  const sharedFactory = createSharedFactory(channel)
  const result = init({ sharedRef: sharedFactory.sharedRef })

  const states = (result.states || {}) as unknown as Record<string, object>
  const actions = (result.actions || {}) as unknown as Record<string, Function>
  return {
    api: { states, actions },
  }
}
