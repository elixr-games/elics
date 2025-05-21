import { performance } from 'node:perf_hooks';

export const ITERATIONS = 100;

export function time(fn) {
        const start = performance.now();
        fn();
        return performance.now() - start;
}

export async function timeAsync(fn) {
        const start = performance.now();
        await fn();
        return performance.now() - start;
}
