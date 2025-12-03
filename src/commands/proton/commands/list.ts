import { Command } from '@cliffy/command';
import { join } from '@std/path';
import { requireOsHandler, withBaseOptions } from '../../command-helpers.ts';
import { createLogger, Logger } from '../../../core/logger.ts';
import { protonPrefixDir } from '../../../core/steam/paths.ts';
import { Table } from '@cliffy/table';
import { IGNORE_VERSIONS } from '../constants.ts';
import { dirSize, sizeToHumanReadable } from '../../../core/utils.ts';
import { getProtonMappings } from '../../../core/steam/proton.ts';

const linuxHandler = async (logger: Logger) => {
  const rootDir = protonPrefixDir();

  const protonVersions = new Set<string>();
  logger.info(`Listing Proton versions installed in ${rootDir}...`);
  for await (const entry of Deno.readDir(rootDir)) {
    if (entry.isDirectory) {
      if (!IGNORE_VERSIONS.includes(entry.name)) {
        if (logger.isDebugEnabled()) {
          const size = await dirSize(join(rootDir, entry.name));
          const humanSize = sizeToHumanReadable(size);
          logger.debug(`Found Proton version ${entry.name} @ ${humanSize}`);
        }
        protonVersions.add(entry.name);
      }
    }
  }

  const games = await getProtonMappings();

  // Print alphabetized list
  let foundUnusedProtonVersions = false;
  logger.info(`Found ${protonVersions.size} Proton versions:`);
  const alphabeticalSorter = (a: string, b: string) => a.localeCompare(b);
  const sortedVersions = [...protonVersions].sort(alphabeticalSorter);
  for (const version of sortedVersions) {
    const matchingGames = games.filter((e) => e.protonVersion === version).sort(
      (a, b) => alphabeticalSorter(a.name, b.name),
    );
    if (matchingGames.length > 0) {
      const table = new Table()
        .body(matchingGames.map((e, i) => [i + 1, e.name]))
        .header(['', version])
        .border(true);
      logger.info(table.toString());
    } else {
      foundUnusedProtonVersions = true;
      logger.info(`  ${version} (no games using this version)`);
    }
  }

  if (foundUnusedProtonVersions) {
    logger.info(
      'Some Proton versions are not used by any games. You can remove them to save disk space with `steamy proton prune`.',
    );
  }
};

export const list = withBaseOptions(
  new Command()
    .name('list')
    .description(
      'Lists installed Proton versions and which games are using them',
    ),
)
  .action(async ({ verbose }) => {
    const logger = createLogger(verbose);

    const handler = requireOsHandler({
      linux: linuxHandler,
    });
    await handler(logger);
  });
