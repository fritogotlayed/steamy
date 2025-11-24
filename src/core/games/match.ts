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
 * Finds Steam games matching the provided name
 * @param gameName - A partial segment of the name of the game to search for
 * @returns Promise<GameMatch[]> Array of matching games with their app IDs
 * @throws SteamyError if Steam directory is inaccessible
 */
export async function findAppIdMatches(gameName: string): Promise<GameMatch[]> {
  if (!gameName || typeof gameName !== 'string') {
    throw new Error('Game name must be a non-empty string');
  }

  const gameDir = steamAppsDir();
  const gameNameUpper = gameName.toLocaleUpperCase();
  const matches: GameMatch[] = [];

  try {
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
      const nameUpper = meta.AppState.name.toLocaleUpperCase();
      if (nameUpper.indexOf(gameNameUpper) > -1) {
        matches.push({
          appId: meta.AppState.appid,
          name: meta.AppState.name,
        });
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error';
    throw new SteamyError(
      `Failed to access Steam directory: ${errorMessage}`,
      'STEAM_NOT_FOUND',
      'Ensure Steam is installed and you have read permissions to the SteamApps directory',
    );
  }
  return matches;
}
