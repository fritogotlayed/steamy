import { join } from '@std/path';
import { protonPrefixDir, steamRootDir } from './paths.ts';
import { parseSteamCacheBody } from './cache-parser.ts';
import { scanSteamCacheFragments } from '../games/match.ts';
import { SteamyError } from '../errors.ts';
import { IGNORE_VERSIONS } from '../../commands/proton/constants.ts';
import { Logger } from '../logger.ts';
import { dirSize, sizeToHumanReadable } from '../utils.ts';

export type ProtonMapping = {
  appid: string;
  name: string;
  protonVersion: string;
};

export async function getCompatToolMappings() {
  const configCachePath = join(steamRootDir(), 'config', 'config.vdf');
  const configCacheBody = await Deno.readTextFile(configCachePath);
  const configCache = parseSteamCacheBody(configCacheBody) as {
    InstallConfigStore: {
      Software: {
        Valve: {
          Steam: {
            CompatToolMapping: Record<string, { name: string }>;
          };
        };
      };
    };
  };

  return configCache.InstallConfigStore.Software.Valve.Steam.CompatToolMapping;
}

export async function getProtonMappings() {
  try {
    const compatToolMapping = await getCompatToolMappings();
    const cacheFileFragments = await scanSteamCacheFragments();

    return cacheFileFragments.map((fragment) => {
      return {
        appid: fragment.AppState.appid,
        name: fragment.AppState.name,
        protonVersion: compatToolMapping[fragment.AppState.appid]?.name ??
          'N/A',
      } satisfies ProtonMapping;
    });
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

export async function getInstalledProtonVersions({
  rootDir,
  ignoreVersions,
  logger,
}: {
  rootDir?: string;
  ignoreVersions?: string[];
  logger?: Logger;
} = {}) {
  const dir = rootDir ?? protonPrefixDir();
  const ignore = ignoreVersions ?? IGNORE_VERSIONS;

  const protonVersions = new Set<string>();
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isDirectory) {
      if (!ignore.includes(entry.name)) {
        if (logger?.isDebugEnabled()) {
          const size = await dirSize(join(dir, entry.name));
          const humanSize = sizeToHumanReadable(size);
          logger?.debug(`Found Proton version ${entry.name} @ ${humanSize}`);
        }
        protonVersions.add(entry.name);
      }
    }
  }

  return protonVersions;
}

export function getUnusedProtonVersions(
  mappings: ProtonMapping[],
  installed: string[],
) {
  return installed.filter(
    (version) => !mappings.some((e) => e.protonVersion === version),
  );
}
