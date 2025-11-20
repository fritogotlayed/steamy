import { Table } from '@cliffy/table';
import { join } from '@std/path';
import { parseSteamCacheFile } from '../utils/parse-steam-caches.ts';

const _homedir = Deno.env.get('HOME');

export type GameMatch = {
  appId: string;
  name: string;
};

export type SteamGameCliArgument = {
  appId?: string;
  name: string;
};

export type SteamGameCommandHandlerType = (
  args: SteamGameCliArgument,
) => Promise<void>;

export type AcfFileFragment = {
  AppState: {
    appid: string;
    name: string;
  };
};

/**
 * Finds Steam games matching the provided name
 * @param gameName - The name of the game to search for
 * @returns Promise<GameMatch[]> Array of matching games with their app IDs
 * @throws Error if Steam directory is inaccessible
 */
export async function findAppIdMatches(gameName: string): Promise<GameMatch[]> {
  if (!gameName || typeof gameName !== 'string') {
    throw new Error('Game name must be a non-empty string');
  }

  if (!_homedir) {
    throw new Error('HOME environment variable not set');
  }

  const gameDir = join(
    _homedir,
    '.steam',
    'steam',
    'steamapps',
  );

  const gameNameUpper = gameName.toLocaleUpperCase();
  const matches: GameMatch[] = [];

  try {
    for await (const entry of Deno.readDir(gameDir)) {
      if (entry.name.endsWith('.acf')) {
        const filePath = join(gameDir, entry.name);

        const meta = await parseSteamCacheFile(
          filePath,
        ) as unknown as AcfFileFragment;
        const nameUpper = meta.AppState.name.toLocaleUpperCase();
        if (nameUpper.indexOf(gameNameUpper) > -1) {
          matches.push({
            appId: meta.AppState.appid,
            name: meta.AppState.name,
          });
        }
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error';
    throw new Error(`Failed to access Steam directory: ${errorMessage}`);
  }
  return matches;
}

/**
 * Prints a table of matches to the console
 * @param matches - Array of matches to print
 */
export function printMatchesTable(matches: GameMatch[]) {
  new Table()
    .body(matches.map((m) => [m.appId, m.name]))
    .header(['AppId', 'Name'])
    .border(true)
    .render();
}

/**
 * Resolves a game based on the provided arguments and runs the provided function
 * @param args - SteamGameCliArgument object containing appId or name
 * @param run - Function to run with the resolved game
 */
export async function resolveGameAndRun(
  args: SteamGameCliArgument,
  run: (game: GameMatch) => void | Promise<void>,
) {
  const { appId, name } = args;
  if (appId) {
    return run({ appId, name });
  }

  const matches = await findAppIdMatches(name);
  if (matches.length === 0) {
    console.log(`No matches found for ${name}. Are you sure it is installed?`);
    return;
  }
  if (matches.length > 1) {
    console.log(`Multiple matches found for ${name}.`);
    printMatchesTable(matches);
    return;
  }
  return run(matches[0]);
}
