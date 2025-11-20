import { Command, ValidationError } from '@cliffy/command';
import {
  type GameMatch,
  resolveGameAndRun,
  SteamGameCommandHandlerType,
} from '../common.ts';
import { readDeadRedemption2 } from './games/read-dead-redemption-2.ts';

// const _homedir = Deno.env.get('HOME');

// TODO: Implement tweaks for the game
const TweakHandlers: Record<string, (() => Promise<void> | void) | undefined> =
  {
    '1174180': () => readDeadRedemption2(),
  };

async function linuxGameTweaks(game: GameMatch) {
  // const prefixDir = [
  //   _homedir,
  //   '.steam',
  //   'steam',
  //   'steamapps',
  //   'compatdata',
  //   game.appId,
  // ].join('/');

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

    const handlers: Record<string, (undefined | SteamGameCommandHandlerType)> =
      {
        // NOTE: having a prefix for windows doesn't make sense
        linux: linuxGameTweaksHandler,
      };

    const handler = handlers[Deno.build.os];
    if (!handler) {
      throw new ValidationError(`Unsupported OS: ${Deno.build.os}`);
    }

    await handler({ appId, name: gameName });
  });
