import { Command, ValidationError } from '@cliffy/command';
import {
  findAppIdMatches,
  type GameMatch,
  type SteamGameCommandHandlerType,
} from './common.ts';
import { Table } from '@cliffy/table';

function linuxLaunch(game: GameMatch) {
  const cmd = new Deno.Command('steam', {
    args: ['-applaunch', game.appId],
  });
  cmd.spawn();
}

const linuxLaunchHandler: SteamGameCommandHandlerType = async (
  { appId, name },
) => {
  if (appId) {
    linuxLaunch({ appId, name });
    return;
  }

  const matches = await findAppIdMatches(name);

  if (matches.length === 0) {
    console.log(`No matches found for ${name}. Are you sure it is installed?`);
  } else if (matches.length > 1) {
    console.log(`Multiple matches found for ${name}.`);
    new Table()
      .body(matches.map((match) => [match.appId, match.name]))
      .header(['AppId', 'Name'])
      .border(true)
      .render();
  } else {
    linuxLaunch(matches[0]);
  }
};

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
