import { describe, expect, it } from 'vitest';
import { createTimeout, createDeferred } from '..';

describe('createTimeout', () => {
  it('createTimeout 超时抛出错误', async () => {
    const { promise } = createTimeout(5, new Error('timeout!'));
    await expect(promise).rejects.toThrow('timeout!');
  });
  it('createTimeout 超时执行自定义逻辑', async () => {
    let x = 1;
    const { promise, isTimeout } = createTimeout(0, () => {
      x++;
    });
    await promise;
    expect(isTimeout.value).toBe(true);
    expect(x).toBe(2);
  });
  it('createTimeout 无错误', async () => {
    const { resolve, promise } = createTimeout(3);
    resolve();
    await promise;
  });
  it('createTimeout 异步成功无错误', async () => {
    const { resolve, promise } = createTimeout(3);
    setTimeout(() => {
      resolve();
    }, 1);
    await promise;
  });
  it('createTimeout 重置倒计时成功', async () => {
    const { resolve, reset, promise } = createTimeout(3);
    setTimeout(() => {
      reset(5);
    }, 1);
    setTimeout(() => {
      resolve();
    }, 5);
    await promise;
  });
});

describe('createDeferred', () => {
  it('createDeferred resolve nothing', async () => {
    const deferred = createDeferred();
    const onCommit = deferred.resolve;
    setTimeout(() => {
      onCommit();
    });
    let succeed = false;
    try {
      await deferred.promise;
      succeed = true;
    } finally {
      expect(succeed).toBeTruthy();
    }
  });
  it('createDeferred resolve data', async () => {
    const deferred = createDeferred<string>();
    const onCommit = deferred.resolve;
    setTimeout(() => {
      onCommit('data');
    });
    let data = '';
    try {
      data = await deferred.promise;
    } finally {
      expect(data).toBe('data');
    }
  });
  it('createDeferred reject', async () => {
    const deferred = createDeferred<undefined, string>();
    const onCancel = deferred.reject;
    setTimeout(() => {
      onCancel('reason');
    });
    let reason = '';
    try {
      await deferred.promise;
    } catch (e) {
      reason = e as string;
    } finally {
      expect(reason).toBe('reason');
    }
  });
});
