import { type Ref } from '@vue/reactivity';
export interface TimeoutApi {
    resolve: Ref<() => void>;
    reject: Ref<(error: Error) => void>;
    reset: (ms?: number) => void;
    promise: Promise<void>;
}
export declare function createTimeout(timeoutMs: number, timeoutError?: Error): TimeoutApi;
