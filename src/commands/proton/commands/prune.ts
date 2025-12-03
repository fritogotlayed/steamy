import { Command } from '@cliffy/command';
import { join } from '@std/path';
import { requireOsHandler, withBaseOptions } from '../../command-helpers.ts';
import { createLogger, Logger } from '../../../core/logger.ts';
import { protonPrefixDir } from '../../../core/steam/paths.ts';
import { Checkbox } from '@cliffy/prompt/checkbox';
import { dirSize, sizeToHumanReadable } from '../../../core/utils.ts';
import {
  getInstalledProtonVersions,
  getProtonMappings,
  getUnusedProtonVersions,
} from '../../../core/steam/proton.ts';

const linuxHandler = async (logger: Logger) => {
  const rootDir = protonPrefixDir();
  logger.info(`Scanning for unused Proton versions in ${rootDir}...`);

  const protonVersions = await getInstalledProtonVersions({ rootDir });
  const games = await getProtonMappings();

  const unusedProtonVersions = getUnusedProtonVersions(games, [
    ...protonVersions,
  ]);
  if (unusedProtonVersions.length > 0) {
    logger.info(
      `Found ${unusedProtonVersions.length} unused Proton versions. Calculating size(s)...`,
    );
    const withSizes = await Promise.all(
      unusedProtonVersions.map(async (version) => {
        const size = await dirSize(join(rootDir, version));
        return { version, size, humanSize: sizeToHumanReadable(size) };
      }),
    );

    // Ask the user to confirm the proton versions to remove
    const selectedVersions: string[] = await Checkbox.prompt({
      message:
        'Use space to toggle, Enter to confirm. Select the Proton versions to remove:',
      options: [
        ...withSizes.sort((a, b) => a.version.localeCompare(b.version)).map((
          e,
        ) => ({
          name: `${e.version} - ${e.humanSize}`,
          value: e.version,
        })),
      ],
    });
    if (selectedVersions.length > 0) {
      const totalSize = selectedVersions.reduce(
        (acc, version) =>
          acc + (withSizes.find((e) => e.version === version)?.size || 0),
        0,
      );
      logger.info(
        `Removing Proton versions: ${
          selectedVersions.join(', ')
        } for a total recovery of ${sizeToHumanReadable(totalSize)}`,
      );

      await Promise.all(selectedVersions.map(async (version) => {
        const path = join(rootDir, version);
        if (logger.isDebugEnabled()) {
          logger.debug(`Removing Proton version ${version} @ ${path}`);
        }
        await Deno.remove(path, { recursive: true });
      }));
    }
  } else {
    logger.info('No unused Proton versions found!');
  }
};

export const prune = withBaseOptions(
  new Command()
    .name('prune')
    .description(
      'Removes unused Proton versions to save disk space.',
    ),
)
  .action(async ({ verbose }) => {
    const logger = createLogger(verbose);

    const handler = requireOsHandler({
      linux: linuxHandler,
    });
    await handler(logger);
  });
