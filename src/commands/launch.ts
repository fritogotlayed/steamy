import { Command } from '@cliffy/command';
import type { SteamGameCommandHandlerType } from './types.ts';
import {
  requireOsHandler,
  resolveGameAndRun,
  withCommonGameOptions,
} from './command-helpers.ts';
import { GameMatch } from '../utils/types.ts';

function linuxLaunch(game: GameMatch) {
  const cmd = new Deno.Command('steam', {
    args: ['-applaunch', game.appId],
  });
  cmd.spawn();
}

const linuxLaunchHandler: SteamGameCommandHandlerType = (args) =>
  resolveGameAndRun(args, linuxLaunch);

export const launch = withCommonGameOptions(
  new Command()
    .name('launch')
    .description('Attempts to launch a steam game by name'),
)
  .arguments('<name...>')
  .action(async ({ appId, verbose: _verbose }, ...name) => {
    // TODO: Implement verbose output
    const gameName = name.join(' ');

    const handler = requireOsHandler({
      linux: linuxLaunchHandler,
    });
    await handler({ appId, name: gameName });
  });
