import { VERSION } from '../../version.ts';
import { getLatestRelease } from './github-releases.ts';
import { isNewerVersion } from './version-compare.ts';
import { readUpdateCache, writeUpdateCache } from './update-cache.ts';

export type UpdateCheckResult = {
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
};

export async function checkForUpdate(): Promise<
  UpdateCheckResult | undefined
> {
  try {
    if (Deno.env.get('STEAMY_NO_UPDATE_CHECK') === '1') return undefined;

    const cached = readUpdateCache();
    if (cached) {
      if (isNewerVersion(VERSION, cached.latestVersion)) {
        return {
          currentVersion: VERSION,
          latestVersion: cached.latestVersion,
          releaseUrl: cached.releaseUrl,
        };
      }
      return undefined;
    }

    const release = await getLatestRelease({ latest: true });
    if (!release) return undefined;

    writeUpdateCache({
      lastChecked: new Date().toISOString(),
      latestVersion: release.tag_name,
      releaseUrl: release.html_url,
    });

    if (isNewerVersion(VERSION, release.tag_name)) {
      return {
        currentVersion: VERSION,
        latestVersion: release.tag_name,
        releaseUrl: release.html_url,
      };
    }
    return undefined;
  } catch {
    return undefined;
  }
}
