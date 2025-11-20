import { Command, ValidationError } from '@cliffy/command';
import {
  type GameMatch,
  resolveGameAndRun,
  type SteamGameCommandHandlerType,
} from './common.ts';

function linuxLaunch(game: GameMatch) {
  const cmd = new Deno.Command('steam', {
    args: ['-applaunch', game.appId],
  });
  cmd.spawn();
}

const linuxLaunchHandler: SteamGameCommandHandlerType = (args) =>
  resolveGameAndRun(args, linuxLaunch);

export const launch = new Command()
  .name('launch')
  .description('Attempts to launch a steam game by name')
  .option('-a, --appId <appId:string>', 'The AppId to launch')
  .option('-v, --verbose', 'Show verbose output')
  .arguments('<name...>')
  .action(async ({ appId, verbose: _verbose }, ...name) => {
    // TODO: Implement verbose output
    const gameName = name.join(' ');

    const handlers: Record<string, (undefined | SteamGameCommandHandlerType)> =
      {
        // NOTE: having a prefix for windows doesn't make sense
        linux: linuxLaunchHandler,
      };

    const handler = handlers[Deno.build.os];
    if (!handler) {
      throw new ValidationError(`Unsupported OS: ${Deno.build.os}`);
    }

    await handler({ appId, name: gameName });
  });
