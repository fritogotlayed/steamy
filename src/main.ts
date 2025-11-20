import { Command, ValidationError } from '@cliffy/command';
import { openPrefix } from './commands/open-prefix.ts';
import { launch } from './commands/launch.ts';
import { gameTweaks } from './commands/game-tweaks/game-tweaks.ts';

// https://cliffy.io/docs@v1.0.0-rc.4/command
await new Command()
  .name('steamy')
  .description('Steam CLI wrapper to make launching games from terminal easy')
  .usage('<sub-command> [OPTIONS]')
  .action(() => {
    throw new ValidationError('Missing sub-command');
  })
  .command('openPrefix', openPrefix)
  .command('launch', launch)
  .command('gameTweaks', gameTweaks)
  .parse(Deno.args);
