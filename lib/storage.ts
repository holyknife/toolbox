/** Async, tool-scoped storage contract. Replace this adapter with an authenticated
 * HTTP client when a backend is ready; tool call sites can stay the same.
 * Only call from effects/events (browser storage is unavailable during SSR).
 */
export interface ToolStorage {
  get<T>(tool: string, key: string, options?: { strict?: boolean }): Promise<T | null>;
  set<T>(tool: string, key: string, value: T): Promise<void>;
  remove(tool: string, key: string): Promise<void>;
}
const storageKey = (tool: string, key: string) => `toolbox:v1:${encodeURIComponent(tool)}:${encodeURIComponent(key)}`;
export const storage: ToolStorage = {
  async get<T>(tool: string, key: string, options?: { strict?: boolean }) {
    if (typeof window === 'undefined') return null;
    const value = window.localStorage.getItem(storageKey(tool, key));
    if (value === null) return null;
    try { return JSON.parse(value) as T; } catch { if (options?.strict) throw new Error('The saved data is damaged and could not be read.'); return null; }
  },
  async set(tool, key, value) { if (typeof window !== 'undefined') window.localStorage.setItem(storageKey(tool, key), JSON.stringify(value)); },
  async remove(tool, key) { if (typeof window !== 'undefined') window.localStorage.removeItem(storageKey(tool, key)); },
};
