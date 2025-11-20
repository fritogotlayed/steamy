import { join } from '@std/path';
import { parseAcf } from '../utils/parse-acf.ts';

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
  const textDecoder = new TextDecoder('utf-8');

  try {
    for await (const entry of Deno.readDir(gameDir)) {
      if (entry.name.endsWith('.acf')) {
        const filePath = join(gameDir, entry.name);
        const fileBody = await Deno.readFile(filePath);

        const meta = parseAcf(
          textDecoder.decode(fileBody),
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
