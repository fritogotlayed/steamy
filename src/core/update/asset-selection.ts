import type { GitHubReleaseAsset } from './types.ts';

/** Architecture markers GE-Proton uses in its per-architecture tarball names. */
const KNOWN_ARCHES = ['x86_64', 'aarch64'];

const hasArchMarker = (name: string) =>
  KNOWN_ARCHES.some((arch) => name.endsWith(`-${arch}.tar.gz`));

/**
 * Picks the Proton tarball matching the running architecture from a release's
 * assets.
 *
 * GE-Proton's asset naming has changed over time:
 * - Through GE-Proton11-2: a single `<tag>.tar.gz` (x86_64 only).
 * - GE-Proton11-3: `<tag>.tar.gz` (x86_64) plus `<tag>-aarch64.tar.gz`.
 * - GE-Proton11-4 onward: `<tag>-x86_64.tar.gz` and `<tag>-aarch64.tar.gz`.
 *
 * @param assets The assets attached to the GitHub release
 * @param tagName The release tag, used to disambiguate same-extension assets
 * @param arch The architecture to select for. Defaults to the running one.
 * @returns The matching tarball, or undefined when the release has none
 */
export function selectProtonTarball(
  assets: GitHubReleaseAsset[],
  tagName: string,
  arch: string = Deno.build.arch,
): GitHubReleaseAsset | undefined {
  const tarballs = assets.filter((a) => a.name.endsWith('.tar.gz'));

  if (tarballs.length === 0) {
    return undefined;
  }

  // Multi-architecture releases: never fall through to another architecture's
  // build, otherwise the download "succeeds" and fails at launch time.
  if (tarballs.some((a) => hasArchMarker(a.name))) {
    const archMatch = tarballs.find((a) =>
      a.name === `${tagName}-${arch}.tar.gz`
    ) ??
      tarballs.find((a) => a.name.endsWith(`-${arch}.tar.gz`));
    if (archMatch) {
      return archMatch;
    }

    // Hybrid releases name the x86_64 build after the tag alone while giving
    // other architectures an explicit suffix.
    return arch === 'x86_64'
      ? tarballs.find((a) => a.name === `${tagName}.tar.gz`)
      : undefined;
  }

  // Legacy single-architecture releases carry no arch marker at all.
  if (tarballs.length === 1) {
    return tarballs[0];
  }

  return tarballs.find((a) => a.name === `${tagName}.tar.gz`);
}
