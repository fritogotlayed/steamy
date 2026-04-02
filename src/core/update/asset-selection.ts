import type { GitHubReleaseAsset } from './types.ts';

export function selectProtonTarball(
  assets: GitHubReleaseAsset[],
  tagName: string,
): GitHubReleaseAsset | undefined {
  const tarballs = assets.filter((a) => a.name.endsWith('.tar.gz'));

  if (tarballs.length === 1) {
    return tarballs[0];
  }

  if (tarballs.length > 1) {
    return tarballs.find((a) => a.name === `${tagName}.tar.gz`);
  }

  return undefined;
}
