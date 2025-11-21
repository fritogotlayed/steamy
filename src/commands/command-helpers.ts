/**
 * @packageDocumentation
 * Provides utility functions for handling Steamy CLI commands
 */

import { type Command, ValidationError } from '@cliffy/command';
import { Table } from '@cliffy/table';
import type { SteamGameCliArgument } from './types.ts';

import { findAppIdMatches } from '../utils/find-app-id-matches.ts';
import { GameMatch } from '../utils/types.ts';

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

export function requireOsHandler<T>(
  handlers: Record<string, T | undefined>,
  os = Deno.build.os,
): T {
  const handler = handlers[os];
  if (!handler) {
    throw new ValidationError(`Unsupported OS: ${os}`);
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
