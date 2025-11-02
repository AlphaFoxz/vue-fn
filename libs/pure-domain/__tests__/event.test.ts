import { describe, expect, it } from 'vitest';
import { createBroadcastEvent, createRequestEvent } from '../event';

describe('broadcast event', () => {
  it('listen', () => {
    let gotMsg: string[] = [];
    const broadcastEvent = createBroadcastEvent<{
      name: string;
    }>();
    broadcastEvent.api.listen(({ data }) => {
      gotMsg.push(data.name);
    });
    broadcastEvent.publish({ name: 'Andy' });
    broadcastEvent.publish({ name: 'Bob' });
    expect(gotMsg).toEqual(['Andy', 'Bob']);
  });

  it('release handler', () => {
    const broadcastEvent = createBroadcastEvent<{
      name: string;
    }>();
    const listener = () => {};
    const release = broadcastEvent.api.listen(listener);
    expect(broadcastEvent.listeners.length).toBe(1);
    expect(broadcastEvent.listeners.indexOf(listener)).toBe(0);
    release();
    expect(broadcastEvent.listeners.length).toBe(0);
  });
});

describe('request event', () => {
  it('listen', async () => {
    let gotMsg: string[] = [];
    let repliedMsg: string[] = [];
    const requestEvent = createRequestEvent<{
      name: string;
    }>().options({
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

  it('release handler', () => {
    const requestEvent = createRequestEvent<{
      name: string;
    }>().options({ onReply(_: {}) {} });
    const listener = () => {
      return {};
    };
    const release = requestEvent.api.listenAndReply(listener);
    expect(requestEvent.listeners.length).toBe(1);
    expect(requestEvent.listeners.indexOf(listener)).toBe(0);
    release();
    expect(requestEvent.listeners.length).toBe(0);
  });
});
