import { Command } from '@cliffy/command';
import type { SteamGameCommandHandlerType } from './types.ts';
import {
  requireOsHandler,
  resolveGameAndRun,
  withCommonGameOptions,
} from './command-helpers.ts';
import { compatDataDir } from '../utils/steam-paths.ts';
import { GameMatch } from '../utils/types.ts';

function linuxOpenPrefix(game: GameMatch) {
  const prefixDir = compatDataDir(game.appId);
  console.log(`Opening prefix for ${game.name}...`);

  const cmd = new Deno.Command('xdg-open', { args: [prefixDir] });
  cmd.spawn();
}

const linuxOpenPrefixHandler: SteamGameCommandHandlerType = (args) =>
  resolveGameAndRun(args, linuxOpenPrefix);

export const openPrefix = withCommonGameOptions(
  new Command()
    .name('openPrefix')
    .description('Open the prefix folder'),
)
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
