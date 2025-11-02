import { expect, it } from 'vitest';
import { createTimeout } from '..';

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
