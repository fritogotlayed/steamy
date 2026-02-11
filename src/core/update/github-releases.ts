import type { Logger } from '../logger.ts';
import type { GitHubRelease } from './types.ts';

export async function getLatestRelease({
  owner = 'fritogotlayed',
  repo = 'steamy',
  logger,
  latest = false,
}: {
  owner?: string;
  repo?: string;
  logger?: Logger;
  latest?: boolean;
} = {}): Promise<GitHubRelease | undefined> {
  try {
    // When latest=true: single-object endpoint, skip sort.
    // Excludes pre-releases and drafts — appropriate for stable update checks.
    if (latest) {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      );
      if (!response.ok) {
        logger?.debug(
          `Failed to fetch latest release from GitHub: Received HTTP ${response.statusText} when making request.`,
        );
        return undefined;
      }
      return await response.json();
    }

    // List endpoint: returns all releases including pre-releases and drafts.
    // Used by callers (e.g. proton download) that may need pre-release or
    // release-candidate versions.
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
    );
    if (!response.ok) {
      logger?.debug(
        `Failed to fetch releases from GitHub: Received HTTP ${response.statusText} when making request.`,
      );
      return undefined;
    }

    const releases: GitHubRelease[] = await response.json();
    const ordered = releases.sort((a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
    return ordered[0];
  } catch (e) {
    logger?.debug(
      `Failed to fetch releases: ${e instanceof Error ? e.message : String(e)}`,
    );
    return undefined;
  }
}
