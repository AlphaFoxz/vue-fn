// 简单的事件系统（仅本地使用，不跨标签）
export type LocalEvent<DATA> = {
  listeners: Set<(data: DATA) => void>;
  publish: (data: DATA) => void;
  api: {
    listen: (callback: (data: DATA) => void) => () => void;
  };
};

export function createLocalEvent<DATA>(): LocalEvent<DATA> {
  const listeners = new Set<(data: DATA) => void>();

  return {
    listeners,
    publish(data: DATA) {
      listeners.forEach((callback) => callback(data));
    },
    api: {
      listen(callback: (data: DATA) => void) {
        listeners.add(callback);
        return () => {
          listeners.delete(callback);
        };
      },
    },
  };
}

// 跨标签页事件系统
export type SharedEvent<DATA> = {
  listeners: Set<(data: DATA) => void>;
  publish: (data: DATA) => void;
  api: {
    listen: (callback: (data: DATA) => void) => () => void;
  };
  __internal__: {
    setBroadcastFunction: (fn: (data: DATA) => void) => void;
  };
};

export function createSharedEvent<DATA>(): SharedEvent<DATA> {
  const listeners = new Set<(data: DATA) => void>();
  let broadcastFn: ((data: DATA) => void) | null = null;

  return {
    listeners,
    publish(data: DATA) {
      // 本地通知
      listeners.forEach((callback) => callback(data));

      // 跨标签广播
      if (broadcastFn) {
        broadcastFn(data);
      }
    },
    api: {
      listen(callback: (data: DATA) => void) {
        listeners.add(callback);
        return () => {
          listeners.delete(callback);
        };
      },
    },
    __internal__: {
      setBroadcastFunction(fn: (data: DATA) => void) {
        broadcastFn = fn;
      },
    },
  };
}
