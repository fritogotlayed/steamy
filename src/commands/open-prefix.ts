import { Command } from '@cliffy/command';
import type { SteamGameCommandHandlerType } from './types.ts';
import {
  requireOsHandler,
  resolveGameAndRun,
  withCommonGameOptions,
} from './command-helpers.ts';
import { compatDataDir } from '../core/steam/paths.ts';
import { GameMatch } from '../core/types.ts';
import { createLogger, Logger } from '../core/logger.ts';

function linuxOpenPrefix(game: GameMatch, logger: Logger) {
  const prefixDir = compatDataDir(game.appId);
  logger.info(`Opening prefix for ${game.name}...`);

  const cmd = new Deno.Command('xdg-open', { args: [prefixDir] });
  cmd.spawn();
}

const linuxOpenPrefixHandler: SteamGameCommandHandlerType = (args, logger) =>
  resolveGameAndRun(args, linuxOpenPrefix, logger);

export const openPrefix = withCommonGameOptions(
  new Command()
    .name('openPrefix')
    .alias('open-prefix')
    .description('Open the prefix folder'),
)
  .arguments('<name...>')
  .action(async ({ appId, verbose }, ...name) => {
    const logger = createLogger(verbose);
    const gameName = name.join(' ');

    const handler = requireOsHandler({
      // NOTE: having a prefix for windows doesn't make sense
      linux: linuxOpenPrefixHandler,
    });
    await handler({ appId, name: gameName }, logger);
  });
