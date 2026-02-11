export type SemVer = {
  major: number;
  minor: number;
  patch: number;
};

export function parseSemver(version: string): SemVer | undefined {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return undefined;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

export function isNewerVersion(current: string, latest: string): boolean {
  const cur = parseSemver(current);
  const lat = parseSemver(latest);
  if (!cur || !lat) return false;

  if (lat.major !== cur.major) return lat.major > cur.major;
  if (lat.minor !== cur.minor) return lat.minor > cur.minor;
  return lat.patch > cur.patch;
}
