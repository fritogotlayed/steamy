import { Command } from '@cliffy/command';
import { redDeadRedemption2 } from './games/red-dead-redemption-2.ts';
import type { SteamGameCommandHandlerType, TweakHandler } from '../types.ts';
import {
  requireOsHandler,
  resolveGameAndRun,
  withCommonGameOptions,
} from '../command-helpers.ts';
import { GameMatch } from '../../core/types.ts';
import { createLogger, Logger } from '../../core/logger.ts';

// The key is the AppId of the game, the value is a function that applies the tweak
const TweakHandlers: Record<string, TweakHandler | undefined> = {
  '1174180': (logger) => redDeadRedemption2(logger),
};

async function linuxGameTweaks(game: GameMatch, logger: Logger) {
  const handler = TweakHandlers[game.appId];
  if (handler) {
    logger.info(`Applying tweaks for ${game.name} (${game.appId})...`);
    await handler(logger);
  } else {
    logger.info(`No tweaks found for ${game.name} (${game.appId})`);
  }
}

const linuxGameTweaksHandler: SteamGameCommandHandlerType = (args, logger) =>
  resolveGameAndRun(args, linuxGameTweaks, logger);

export const gameTweaks = withCommonGameOptions(
  new Command()
    .name('gameTweaks')
    .alias('game-tweaks')
    .description('Tweaks for a specific games'),
)
  .arguments('<name...>')
  .action(async ({ appId, verbose }, ...name) => {
    const logger = createLogger(verbose);
    const gameName = name.join(' ');

    const handler = requireOsHandler({
      linux: linuxGameTweaksHandler,
    });
    await handler({ appId, name: gameName }, logger);
  });
