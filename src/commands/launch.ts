import { Command } from '@cliffy/command';
import {
  type GameMatch,
  requireOsHandler,
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

    const handler = requireOsHandler({
      linux: linuxLaunchHandler,
    });
    await handler({ appId, name: gameName });
  });
