/**
 * @packageDocumentation
 * Utility functions for finding Steam game information by partial name matches
 */
import { join } from '@std/path';
import { pooledMap } from '@std/async';
import type { CacheFileFragment, GameMatch } from '../types.ts';
import { steamAppsDir } from '../steam/paths.ts';
import { parseSteamCacheFile } from '../steam/cache-parser.ts';
import { SteamyError } from '../errors.ts';

/**
 * Scans the Steam apps cache directory and returns parsed cache fragments
 * for every `.acf` file found.
 *
 * This is a general-purpose building block intended to be consumed by
 * `findAppIdMatches` and other features that need raw cache metadata.
 *
 * @returns Promise<CacheFileFragment[]> Array of cache fragments from all appmanifest files
 * @throws SteamyError if Steam directory is inaccessible or parsing fails
 */
export async function scanSteamCacheFragments(): Promise<CacheFileFragment[]> {
  try {
    const fragments: CacheFileFragment[] = [];
    const gameDir = steamAppsDir();

    const acfFiles: string[] = [];
    for await (const entry of Deno.readDir(gameDir)) {
      if (entry.name.endsWith('.acf')) {
        acfFiles.push(join(gameDir, entry.name));
      }
    }

    const concurrency = 8;
    const results = pooledMap(
      concurrency,
      acfFiles,
      async (filePath) => {
        return await parseSteamCacheFile(
          filePath,
        ) as unknown as CacheFileFragment;
      },
    );

    for await (const meta of results) {
      fragments.push(meta);
    }

    return fragments;
  } catch (error: unknown) {
    // Preserve existing error wrapping semantics
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error';
    throw new SteamyError(
      `Failed to access Steam directory: ${errorMessage}`,
      'STEAM_NOT_FOUND',
      'Ensure Steam is installed and you have read permissions to the SteamApps directory',
    );
  }
}

/**
 * Finds Steam games matching the provided name
 * @param gameName - A partial segment of the name of the game to search for
 * @returns Promise<GameMatch[]> Array of matching games with their app IDs
 * @throws SteamyError if Steam directory is inaccessible
 */
export async function findAppIdMatches(gameName: string): Promise<GameMatch[]> {
  if (!gameName || typeof gameName !== 'string') {
    throw new Error('Game name must be a non-empty string');
  }

  const gameNameUpper = gameName.toLocaleUpperCase();
  const matches: GameMatch[] = [];

  const fragments = await scanSteamCacheFragments();
  for (const meta of fragments) {
    const nameUpper = meta.AppState.name.toLocaleUpperCase();
    if (nameUpper.indexOf(gameNameUpper) > -1) {
      matches.push({
        appId: meta.AppState.appid,
        name: meta.AppState.name,
      });
    }
  }

  return matches;
}
