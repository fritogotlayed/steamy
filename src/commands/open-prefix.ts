import { Command, ValidationError } from '@cliffy/command';
import {
  type GameMatch,
  resolveGameAndRun,
  type SteamGameCommandHandlerType,
} from './common.ts';

const _homedir = Deno.env.get('HOME');

function linuxOpenPrefix(game: GameMatch) {
  const prefixDir = [
    _homedir,
    '.steam',
    'steam',
    'steamapps',
    'compatdata',
    game.appId,
  ].join('/');

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

    const handlers: Record<string, (undefined | SteamGameCommandHandlerType)> =
      {
        // NOTE: having a prefix for windows doesn't make sense
        linux: linuxOpenPrefixHandler,
      };

    const handler = handlers[Deno.build.os];
    if (!handler) {
      throw new ValidationError(`Unsupported OS: ${Deno.build.os}`);
    }

    await handler({ appId, name: gameName });
  });
