import { Command, ValidationError } from '@cliffy/command';
import { openPrefix } from './commands/open-prefix.ts';
import { launch } from './commands/launch.ts';
import { gameTweaks } from './commands/game-tweaks/game-tweaks.ts';
import { proton } from './commands/proton/proton.ts';
import { update } from './commands/update.ts';
import { getExitCode, SteamyError } from './core/errors.ts';
import { BUILT_AT, COMMIT, VERSION } from './version.ts';
import { checkForUpdate } from './core/update/version-check.ts';

const isUpdateCommand = Deno.args[0] === 'update';
const updateCheckPromise = isUpdateCommand ? undefined : checkForUpdate();

try {
  await new Command()
    .name('steamy')
    .description('Steam CLI wrapper to make launching games from terminal easy')
    .usage('<sub-command> [OPTIONS]')
    .action(() => {
      throw new ValidationError('Missing sub-command');
    })
    .version(`${VERSION} (${COMMIT}) built at ${BUILT_AT}`)
    .command('openPrefix', openPrefix)
    .command('launch', launch)
    .command('gameTweaks', gameTweaks)
    .command('proton', proton)
    .command('update', update)
    .parse(Deno.args);
} catch (e: unknown) {
  if (e instanceof SteamyError) {
    console.error(`❌ ${e.message}`);
    if (e.hint) console.error(`💡 ${e.hint}`);
    Deno.exit(getExitCode(e.code));
  }
  throw e;
}

if (updateCheckPromise) {
  try {
    const timeout = new Promise<undefined>((resolve) => {
      const id = setTimeout(() => resolve(undefined), 2000);
      Deno.unrefTimer(id);
    });
    const result = await Promise.race([updateCheckPromise, timeout]);
    if (result) {
      console.error(
        `\nA new version of steamy is available: ${result.currentVersion} -> ${result.latestVersion}`,
      );
      console.error(
        `Run "steamy update" to update, or download from: ${result.releaseUrl}`,
      );
      console.error(
        'To suppress this notice, set STEAMY_NO_UPDATE_CHECK=1',
      );
    }
  } catch {
    // Never let update check errors affect the CLI
  }
}
