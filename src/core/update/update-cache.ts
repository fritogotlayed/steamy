import { join } from '@std/path';
import type { UpdateCacheData } from './types.ts';

const CACHE_FILE = 'update-check.json';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getCacheDir(): string | undefined {
  const os = Deno.build.os;
  if (os === 'darwin') {
    const home = Deno.env.get('HOME');
    if (!home) return undefined;
    return join(home, 'Library', 'Caches', 'steamy');
  }
  // Linux (and fallback)
  const xdg = Deno.env.get('XDG_CACHE_HOME');
  if (xdg) return join(xdg, 'steamy');
  const home = Deno.env.get('HOME');
  if (!home) return undefined;
  return join(home, '.cache', 'steamy');
}

export function readUpdateCache(
  ttlMs = DEFAULT_TTL_MS,
): UpdateCacheData | undefined {
  try {
    const dir = getCacheDir();
    if (!dir) return undefined;
    const path = join(dir, CACHE_FILE);
    const raw = Deno.readTextFileSync(path);
    const data: UpdateCacheData = JSON.parse(raw);
    const age = Date.now() - new Date(data.lastChecked).getTime();
    if (age > ttlMs) return undefined;
    return data;
  } catch {
    return undefined;
  }
}

export function writeUpdateCache(data: UpdateCacheData): void {
  try {
    const dir = getCacheDir();
    if (!dir) return;
    Deno.mkdirSync(dir, { recursive: true });
    const path = join(dir, CACHE_FILE);
    Deno.writeTextFileSync(path, JSON.stringify(data));
  } catch {
    // Silently ignore write failures
  }
}
