/**
 * @packageDocumentation
 * Utility functions for quickly accessing Steam directories
 */
import { join } from '@std/path';

/**
 * Returns the value of the HOME environment variable or throws an error if it is not set
 */
export function requireHomeDir() {
  const home = Deno.env.get('HOME');
  if (!home) throw new Error('HOME environment variable not set');
  return home;
}

/**
 * Returns the path to the Steam root directory
 */
export function steamRootDir() {
  const home = requireHomeDir();
  return join(home, '.steam', 'steam');
}

/**
 * Returns the path to the Steam apps directory
 */
export function steamAppsDir() {
  return join(steamRootDir(), 'steamapps');
}

/**
 * Returns the path to the compatdata directory for the specified app ID
 * @param appId - The app ID to get the compatdata directory for
 */
export function compatDataDir(appId: string) {
  return join(steamAppsDir(), 'compatdata', appId);
}

/**
 * Returns the path to the Proton prefix directory
 */
export function protonPrefixDir() {
  return join(steamRootDir(), 'compatibilitytools.d');
}

/**
 * Returns the path to the common directory for the specified game
 * @param folderName - The name of the game folder
 */
export function gameCommonDir(folderName: string) {
  return join(steamAppsDir(), 'common', folderName);
}
