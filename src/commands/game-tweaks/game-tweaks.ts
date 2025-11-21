import { Command } from '@cliffy/command';
import { readDeadRedemption2 } from './games/read-dead-redemption-2.ts';
import type { GameMatch, SteamGameCommandHandlerType } from '../types.ts';
import { requireOsHandler, resolveGameAndRun } from '../command-helpers.ts';

// The key is the AppId of the game, the value is a function that applies the tweak
const TweakHandlers: Record<string, (() => Promise<void> | void) | undefined> =
  {
    '1174180': () => readDeadRedemption2(),
  };

async function linuxGameTweaks(game: GameMatch) {
  const handler = TweakHandlers[game.appId];
  if (handler) {
    console.log(`Applying tweaks for ${game.name} (${game.appId})...`);
    const result = handler();
    if (result?.then) {
      await result;
    }
  } else {
    console.log(`No tweaks found for ${game.name} (${game.appId})`);
  }
}

const linuxGameTweaksHandler: SteamGameCommandHandlerType = (args) =>
  resolveGameAndRun(args, linuxGameTweaks);

export const gameTweaks = new Command()
  .name('gameTweaks')
  .description('Tweaks for a specific games')
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
      linux: linuxGameTweaksHandler,
    });
    await handler({ appId, name: gameName });
  });
