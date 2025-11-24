import { Command } from '@cliffy/command';
import type { SteamGameCommandHandlerType } from './types.ts';
import {
  requireOsHandler,
  resolveGameAndRun,
  withCommonGameOptions,
} from './command-helpers.ts';
import { GameMatch } from '../core/types.ts';
import { createLogger, Logger } from '../core/logger.ts';

function linuxLaunch(game: GameMatch, _logger: Logger) {
  const cmd = new Deno.Command('steam', {
    args: ['-applaunch', game.appId],
  });
  cmd.spawn();
}

const linuxLaunchHandler: SteamGameCommandHandlerType = (args, logger) =>
  resolveGameAndRun(args, linuxLaunch, logger);

export const launch = withCommonGameOptions(
  new Command()
    .name('launch')
    .description('Attempts to launch a steam game by name'),
)
  .arguments('<name...>')
  .action(async ({ appId, verbose }, ...name) => {
    const logger = createLogger(verbose);
    const gameName = name.join(' ');

    const handler = requireOsHandler({
      linux: linuxLaunchHandler,
    });
    await handler({ appId, name: gameName }, logger);
  });
