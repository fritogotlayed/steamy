import { Command } from '@cliffy/command';
import { Confirm } from '@cliffy/prompt';
import { withBaseOptions } from './command-helpers.ts';
import { createLogger } from '../core/logger.ts';
import { VERSION } from '../version.ts';
import { getLatestRelease } from '../core/update/github-releases.ts';
import { isNewerVersion } from '../core/update/version-compare.ts';
import {
  isSourceInstall,
  performSelfUpdate,
} from '../core/update/self-update.ts';
import { writeUpdateCache } from '../core/update/update-cache.ts';
import { SteamyError } from '../core/errors.ts';

export const update = withBaseOptions(
  new Command()
    .name('update')
    .description('Update steamy to the latest version.'),
)
  .action(async ({ verbose }) => {
    const logger = createLogger(verbose);

    logger.info(`Current version: ${VERSION}`);
    logger.info('Checking for updates...');

    const release = await getLatestRelease({ logger, latest: true });
    if (!release) {
      throw new SteamyError(
        'Failed to check for updates. Please try again later.',
        'EXTERNAL_DEPENDENCY_ERROR',
      );
    }

    writeUpdateCache({
      lastChecked: new Date().toISOString(),
      latestVersion: release.tag_name,
      releaseUrl: release.html_url,
    });

    if (!isNewerVersion(VERSION, release.tag_name)) {
      logger.info(`You are already on the latest version (${VERSION}).`);
      return;
    }

    logger.info(`New version available: ${VERSION} -> ${release.tag_name}`);

    if (isSourceInstall()) {
      logger.info(
        'This appears to be a source-built binary. You may want to use "deno task release-build" instead.',
      );
      const proceed = await Confirm.prompt('Proceed with update anyway?');
      if (!proceed) {
        logger.info('Update cancelled.');
        return;
      }
    }

    await performSelfUpdate(release, logger);
  });
