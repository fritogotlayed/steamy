import { copy, readerFromStreamReader } from '@std/io';
import { Command } from '@cliffy/command';
import { join } from '@std/path';
import { requireOsHandler, withBaseOptions } from '../../command-helpers.ts';
import { createLogger, Logger } from '../../../core/logger.ts';
import { protonPrefixDir } from '../../../core/steam/paths.ts';
import { Table } from '@cliffy/table';
import { IGNORE_VERSIONS } from '../constants.ts';
import {
  dirSize,
  extractWithSystemTar,
  sizeToHumanReadable,
} from '../../../core/utils.ts';
import {
  getInstalledProtonVersions,
  getProtonMappings,
} from '../../../core/steam/proton.ts';
import { SteamyError } from '../../../core/errors.ts';
import { startSpinner } from '../../../core/spinner.ts';

// NOTE: this is a partial type definition for the response data from the GitHub API.
type ReleasesResponseData = {
  id: number;
  tag_name: string;
  published_at: string; // ISO 8601 date string
  body: string;
  assets: {
    name: string;
    content_type: string;
    browser_download_url: string;
    size: number;
  }[];
};

async function getLatestRelease({
  owner,
  repo,
  logger,
}: {
  owner: string;
  repo: string;
  logger: Logger;
}) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases`,
  );
  if (!response.ok) {
    logger.debug(
      `Failed to fetch releases from GitHub: Received HTTP ${response.statusText} when making request.`,
    );
    throw new SteamyError(
      `Failed to fetch releases from GitHub: ${response.statusText}`,
      'EXTERNAL_DEPENDENCY_ERROR',
    );
  }
  const releases: ReleasesResponseData[] = await response.json();
  const orderedReleases = releases.sort((a, b) =>
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  return orderedReleases[0];
}

const linuxHandler = async (logger: Logger) => {
  const rootDir = protonPrefixDir();

  logger.info('Discovering the locally installed Proton versions...');
  const protonVersions = await getInstalledProtonVersions({ rootDir });

  logger.info('Acquiring the latest GE proton releases list from GitHub...');
  const latestRelease = await getLatestRelease({
    owner: 'GloriousEggroll',
    repo: 'proton-ge-custom',
    logger,
  });

  if (protonVersions.has(latestRelease.tag_name)) {
    logger.info(
      `The latest Proton ${latestRelease.tag_name} released on ${latestRelease.published_at} is already installed!`,
    );
  } else {
    // TODO: implement
    // https://medium.com/deno-the-complete-reference/file-download-through-fetch-api-in-deno-771f30b19471

    // Download the release tarball
    const asset = latestRelease.assets.find((e) =>
      e.content_type === 'application/x-gtar'
    )!;
    const downloadUrl = asset?.browser_download_url;
    if (!asset || !downloadUrl) {
      throw new SteamyError(
        `No Proton tarball found for ${latestRelease.tag_name}!`,
        'EXTERNAL_DEPENDENCY_ERROR',
      );
    }

    logger.info(`Downloading Proton ${latestRelease.tag_name} from GitHub...`);
    logger.debug(
      `Downloading tarball of size ${
        sizeToHumanReadable(asset.size)
      } from ${downloadUrl}`,
    );

    const tarballPath = `${protonPrefixDir()}/${latestRelease.tag_name}.tar.gz`;
    const downloadSpinner = startSpinner({ text: 'Downloading' });
    try {
      const response = await fetch(downloadUrl);
      const responseReader = response.body?.getReader();
      if (responseReader) {
        const reader = readerFromStreamReader(responseReader);
        const file = await Deno.open(tarballPath, {
          create: true,
          write: true,
        });
        await copy(reader, file);
        file.close();
      }
    } finally {
      // Ensure spinner is always stopped, even on errors
      downloadSpinner.stop();
    }

    // Extract the release tarball to the prefix dir
    logger.info(`Extracting Proton ${latestRelease.tag_name} to ${rootDir}...`);
    const extractSpinner = startSpinner({ text: 'Extracting' });
    try {
      await extractWithSystemTar(tarballPath, protonPrefixDir());
    } finally {
      // Ensure spinner is always stopped, even on errors
      extractSpinner.stop();
    }

    Deno.removeSync(tarballPath, { recursive: true });
    logger.info(
      `Proton ${latestRelease.tag_name} successfully downloaded and extracted!`,
    );
  }
};

export const download = withBaseOptions(
  new Command()
    .name('download')
    .description(
      'Checks for newer released versions of GE Proton and downloads them.',
    ),
)
  .action(async ({ verbose }) => {
    const logger = createLogger(verbose);

    const handler = requireOsHandler({
      linux: linuxHandler,
    });
    await handler(logger);
  });
