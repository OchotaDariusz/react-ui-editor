import type { NodesMap } from '../types/editor';

export const AUTO_SAVE_INTERVAL_MS = 5000;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface AutoSaveControllerOptions {
  getNodes: () => NodesMap;
  storage: StorageLike | null | undefined;
  storageKey: string;
  intervalMs?: number;
  onSaved?: (serialized: string) => void;
  setIntervalFn?: (fn: () => void, ms: number) => number;
  clearIntervalFn?: (id: number) => void;
}

export interface AutoSaveController {
  start: () => void;
  stop: () => void;
  flush: () => boolean;
}

export function persistTreeState(
  storage: StorageLike | null | undefined,
  storageKey: string,
  nodes: NodesMap
): string | null {
  if (!storage) return null;
  try {
    const serialized = JSON.stringify(nodes);
    storage.setItem(storageKey, serialized);
    return serialized;
  } catch {
    return null;
  }
}

export function createAutoSaveController({
  getNodes,
  storage,
  storageKey,
  intervalMs = AUTO_SAVE_INTERVAL_MS,
  onSaved,
  setIntervalFn = (fn, ms) => window.setInterval(fn, ms),
  clearIntervalFn = (id) => window.clearInterval(id),
}: AutoSaveControllerOptions): AutoSaveController {
  let timerId: number | null = null;

  const flush = (): boolean => {
    const serialized = persistTreeState(storage, storageKey, getNodes());
    if (serialized !== null) {
      onSaved?.(serialized);
      return true;
    }
    return false;
  };

  const start = () => {
    if (timerId !== null) return;
    timerId = setIntervalFn(() => {
      flush();
    }, intervalMs);
  };

  const stop = () => {
    if (timerId === null) return;
    clearIntervalFn(timerId);
    timerId = null;
  };

  return {
    start,
    stop,
    flush,
  };
}
