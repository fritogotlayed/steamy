/**
 * @packageDocumentation
 * Provides utility functions for handling Steamy CLI commands
 */

import { type Command } from '@cliffy/command';
import { Table } from '@cliffy/table';
import type { SteamGameCliArgument } from './types.ts';

import { findAppIdMatches } from '../core/games/match.ts';
import { GameMatch } from '../core/types.ts';
import { Logger } from '../core/logger.ts';
import { SteamyError } from '../core/errors.ts';

/**
 * Prints a table of matches to the console
 * @param matches - Array of matches to print
 * @param logger - Logger instance to use for output
 */
export function printMatchesTable(matches: GameMatch[], logger: Logger) {
  const table = new Table()
    .body(matches.map((m) => [m.appId, m.name]))
    .header(['AppId', 'Name'])
    .border(true);

  logger.info(table.toString());
}

/**
 * Resolves a game based on the provided arguments and runs the provided function
 * @param args - SteamGameCliArgument object containing appId or name
 * @param run - Function to run with the resolved game
 * @param logger - Logger instance to use for output
 */
export async function resolveGameAndRun(
  args: SteamGameCliArgument,
  run: (game: GameMatch, logger: Logger) => void | Promise<void>,
  logger: Logger,
) {
  const { appId, name } = args;
  if (appId) {
    return run({ appId, name }, logger);
  }

  const matches = await findAppIdMatches(name);
  if (matches.length === 0) {
    throw new SteamyError(
      `No matches found for ${name}`,
      'GAME_NOT_FOUND',
      'Are you sure it is installed?',
    );
  }
  if (matches.length > 1) {
    logger.info(`Multiple matches found for ${name}.`);
    printMatchesTable(matches, logger);
    throw new SteamyError(
      `Multiple matches found for ${name}`,
      'GAME_AMBIGUOUS',
      'Use --appId to specify the game.',
    );
  }
  return run(matches[0], logger);
}

export function requireOsHandler<T>(
  handlers: Record<string, T | undefined>,
  os = Deno.build.os,
): T {
  const handler = handlers[os];
  if (!handler) {
    throw new SteamyError(`Unsupported OS: ${os}`, 'UNSUPPORTED_OS');
  }
  return handler;
}

export function withCommonGameOptions(cmd: Command) {
  return cmd
    .option(
      '-a, --appId <appId:string>',
      'The AppId to use when filtering by name is ambiguous',
    )
    .option('-v, --verbose', 'Show verbose output');
}
