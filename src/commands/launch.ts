import { Command } from '@cliffy/command';
import type { SteamGameCommandHandlerType } from './types.ts';
import {
  requireOsHandler,
  resolveGameAndRun,
  withCommonGameOptions,
} from './command-helpers.ts';
import { GameMatch } from '../core/types.ts';
import { createLogger, Logger } from '../core/logger.ts';

// Checks for an exact process name match via `pgrep -x`
export async function isProcessRunningByName(name: string): Promise<boolean> {
  const cmd = new Deno.Command("pgrep", { args: ["-x", name] });
  try {
    const { code } = await cmd.output();
    return code === 0; // 0 if one or more PIDs matched
  } catch (_) {
    // pgrep not found or other error
    return false;
  }
}

async function linuxLaunch(game: GameMatch, logger: Logger) {
  const isSteamRunning = await isProcessRunningByName('steam');
  if (!isSteamRunning) {
    logger.info('Steam is not running. Please start Steam and try again.');
    return;
  }

  logger.info(`Launching ${game.name}...`);
  logger.debug(`Launching steam with -applaunch ${game.appId}`);

  const debug = logger.isDebugEnabled();

  const cmd = new Deno.Command('steam', {
    args: ['-applaunch', game.appId],
    stdin: 'null',
    stdout: debug ? 'piped' : 'null',
    stderr: debug ? 'piped' : 'null',
  });

  const proc = cmd.spawn();

  if (debug) {
    const dec = new TextDecoder();
    void proc.stdout?.pipeTo(new WritableStream({
      write: (chunk) => logger.debug(dec.decode(chunk)),
    }));
    void proc.stderr?.pipeTo(new WritableStream({
      write: (chunk) => logger.debug(dec.decode(chunk)),
    }));
  }
}

const linuxLaunchHandler: SteamGameCommandHandlerType = (args, logger) =>
  resolveGameAndRun(args, linuxLaunch, logger);

export const launch = withCommonGameOptions(
  new Command()
    .name('launch')
    .description('Attempts to launch a steam game by name'),
)
  .arguments('<name...>')
  .action(async ({ appId, verbose }, ...name) => {
    const logger = createLogger(verbose);
    const gameName = name.join(' ');

    const handler = requireOsHandler({
      linux: linuxLaunchHandler,
    });
    await handler({ appId, name: gameName }, logger);
  });
