import { it, expect } from 'vitest';
import { createBroadcastEvent, createRequestEvent, largeNumberIncrease } from '../event';
import { reactive, ref } from '@vue/reactivity';

it('createRequestEvent unref', async () => {
  const str = ref('');
  const num = ref(1);
  const bool = ref(true);
  const obj = reactive({});
  const event = createRequestEvent<
    { str: typeof str; num: typeof num; bool: typeof bool; obj: typeof obj },
    undefined
  >().options({
    onReply() {},
  });
  let gotStr: string | undefined;
  let gotNum: number | undefined;
  let gotBool: boolean | undefined;
  let gotObj: object | undefined;
  event.api.listenAndReply(({ data }) => {
    gotStr = data.str;
    gotNum = data.num;
    gotBool = data.bool;
    gotObj = data.obj;
  });
  event.publishRequest({ str: '', num: 0, bool: true, obj });
  await Promise.resolve();
  expect(gotStr).toBe('');
  expect(gotNum).toBe(0);
  expect(gotBool).toBe(true);
  expect(gotObj).toEqual({});
});

it('createRequestEvent 触发事件', async () => {
  function register() {
    const name = ref('wong');
    const event = createRequestEvent<{ name: typeof name }>().options({ onReply() {} });
    return event;
  }
  const event = register();
  const repo = { name: '', version: '0' };
  event.api.listenAndReply(({ data, version }) => {
    repo.name = data.name;
    repo.version = version;
    return;
  });
  event.publishRequest({ name: 'wong' });
  expect(repo.name).toBe('wong');
  expect(repo.version).toBe('1');
  event.publishRequest({ name: 'wong' });
  expect(repo.version).toBe('2');
});

it('createRequestEvent 顺序消费', async () => {
  let gotMsg: string[] = [];
  let repliedMsg: string[] = [];
  const requestEvent = createRequestEvent<
    {
      name: string;
    },
    { msg: string }
  >().options({
    onReply(data: { msg: string }) {
      repliedMsg.push(data.msg);
    },
  });
  requestEvent.api.listenAndReply(({ data }) => {
    gotMsg.push(data.name);
    return { msg: 'OK' };
  });
  await requestEvent.publishRequest({ name: 'Andy' });
  await requestEvent.publishRequest({ name: 'Bob' });
  expect(gotMsg).toEqual(['Andy', 'Bob']);
  expect(repliedMsg).toEqual(['OK', 'OK']);
});

it('createRequestEvent 函数的回调', async () => {
  let succeed = false;
  function register() {
    const name = ref('wong');
    const event = createRequestEvent<{ name: typeof name }>().options({
      onReply() {
        succeed = true;
      },
    });
    return event;
  }
  const event = register();
  event.api.listenAndReply(({ data }) => {
    if (data.name === 'Andy') {
      succeed = true;
      return;
    } else {
      throw new Error('error');
    }
  });
  event.publishRequest({ name: 'Andy' });
  expect(succeed).toBeTruthy();
});

it('createRequestEvent 错误后停止Promise', async () => {
  const listenerCounter = ref(0);
  let succeed = false;
  function createInitEvent() {
    const event = createRequestEvent<{}, string>().options({
      onReply(name: string) {
        listenerCounter.value++;
        if (name !== 'Andy') {
          return;
        }
        succeed = true;
      },
      onError() {},
      isTerminateOnError: true,
    });
    return event;
  }
  const watchedEventsCounter = ref(0);
  const initEvent = createInitEvent();
  initEvent.api.listenAndReply(({}) => {
    watchedEventsCounter.value++;
    return 'wong';
  });
  initEvent.api.listenAndReply(({}) => {
    watchedEventsCounter.value++;
    return 'Andy';
  });
  initEvent.publishRequest({ name: 'Andy' });
  expect(succeed).toBe(true);
  expect(listenerCounter.value).toBe(2);
  expect(watchedEventsCounter.value).toBe(2);
});

it('createRequestEvent 错误后不停止Promise', async () => {
  const listenerCounter = ref(0);
  const watchedCounter = ref(0);
  let succeed = false;
  function createInitEvent() {
    const event = createRequestEvent<{}, string>().options({
      onReply(name: string) {
        listenerCounter.value++;
        if (name !== 'Andy') {
          return new Error('incorrect name');
        }
        succeed = true;
      },
    });
    return event;
  }
  const initEvent = createInitEvent();
  initEvent.api.listenAndReply(({}) => {
    watchedCounter.value++;
    return 'wong';
  });
  initEvent.api.listenAndReply(({}) => {
    watchedCounter.value++;
    return 'Andy';
  });
  await initEvent.publishRequest({ name: 'Andy' });
  expect(succeed).toBe(true);
  expect(listenerCounter.value).toBe(2);
  expect(watchedCounter.value).toBe(2);
});

it('createRequestEvent 超时', async () => {
  let replyed = false;
  const event = createRequestEvent<{}>().options({
    onReply() {
      replyed = true;
    },
    onError(e: Error) {
      expect(e).toBeInstanceOf(Error);
      throwed = true;
    },
  });
  let throwed = false;
  event.publishRequest({});
  expect(replyed).toBe(false);
  expect(throwed).toBe(false);
  event.api.listenAndReply(() => {
    throw new Error('error');
  });
  event.publishRequest({});
  expect(replyed).toBe(false);
  expect(throwed).toBe(true);
});

it('createBroadcastEvent unref', async () => {
  const str = ref('');
  const num = ref(1);
  const bool = ref(true);
  const obj = reactive({});
  const event = createBroadcastEvent<{
    str: typeof str;
    num: typeof num;
    bool: typeof bool;
    obj: typeof obj;
  }>();
  let gotStr: string | undefined;
  let gotNum: number | undefined;
  let gotBool: boolean | undefined;
  let gotObj: object | undefined;
  event.api.listen(({ data }) => {
    gotStr = data.str;
    gotNum = data.num;
    gotBool = data.bool;
    gotObj = data.obj;
  });
  event.publish({ str: '', num: 0, bool: true, obj });
  await Promise.resolve();
  expect(gotStr).toBe('');
  expect(gotNum).toBe(0);
  expect(gotBool).toBe(true);
  expect(gotObj).toEqual({});
});

it('createBroadcastEvent 广播1', async () => {
  const listenCounter = ref(0);
  const listenedName = ref('');
  function createInitEvent() {
    return createBroadcastEvent<{ name: string }>();
  }
  const initEvent = createInitEvent();
  initEvent.api.listen(({ data }) => {
    ++listenCounter.value;
    listenedName.value = data.name;
  });
  initEvent.api.listen(({ data }) => {
    ++listenCounter.value;
    listenedName.value = data.name;
  });

  initEvent.publish({ name: 'Andy' });
  initEvent.publish({ name: 'Bob' });
  expect(listenCounter.value).toBe(4);
  expect(listenedName.value).toEqual('Bob');
});

it('createBroadcastEvent 广播2', async () => {
  const listenCounter = ref(0);
  const listenedName = ref('');
  function createInitEvent() {
    const name = ref('bob');
    const event = createBroadcastEvent<{ name: typeof name }>();
    return event;
  }
  const initEvent = createInitEvent();
  initEvent.api.listen(({ data }) => {
    ++listenCounter.value;
    listenedName.value = data.name;
  });
  initEvent.api.listen(({ data }) => {
    ++listenCounter.value;
    listenedName.value = data.name;
  });

  initEvent.publish({ name: 'Andy' });
  initEvent.publish({ name: 'Bob' });
  expect(listenCounter.value).toBe(4);
  expect(listenedName.value).toEqual('Bob');
});

it('largeNumberIncrement', () => {
  let num = '9007199254740991';
  num = largeNumberIncrease(num);
  expect(num).toBe('9007199254740992');
  num = largeNumberIncrease(num);
  expect(num).toBe('9007199254740993');
  num = largeNumberIncrease(num);
  expect(num).toBe('9007199254740994');
  num = largeNumberIncrease(num);
  expect(num).toBe('9007199254740995');
  num = largeNumberIncrease(num);
  expect(num).toBe('9007199254740996');
});
