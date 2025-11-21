import { Command } from '@cliffy/command';
import type { GameMatch, SteamGameCommandHandlerType } from './types.ts';
import { requireOsHandler, resolveGameAndRun } from './command-helpers.ts';
import { compatDataDir } from '../utils/steam-paths.ts';

function linuxOpenPrefix(game: GameMatch) {
  const prefixDir = compatDataDir(game.appId);
  console.log(`Opening prefix for ${game.name}...`);

  const cmd = new Deno.Command('xdg-open', { args: [prefixDir] });
  cmd.spawn();
}

const linuxOpenPrefixHandler: SteamGameCommandHandlerType = (args) =>
  resolveGameAndRun(args, linuxOpenPrefix);

export const openPrefix = new Command()
  .name('openPrefix')
  .description('Open the prefix folder')
  .option(
    '-a, --appId <appId:string>',
    'The AppId to launch if filtering by name alone will not suffice.',
  )
  .option('-v, --verbose', 'Show verbose output')
  .arguments('<name...>')
  .action(async ({ appId, verbose: _verbose }, ...name) => {
    // TODO: Implement verbose output
    const gameName = name.join(' ');

    const handler = requireOsHandler({
      // NOTE: having a prefix for windows doesn't make sense
      linux: linuxOpenPrefixHandler,
    });
    await handler({ appId, name: gameName });
  });
