import { dirname, join } from '@std/path';
import { SteamyError } from '../errors.ts';
import type { Logger } from '../logger.ts';
import type { GitHubRelease } from './types.ts';
import { startSpinner } from '../spinner.ts';

const ASSET_MAP: Record<string, string> = {
  'linux-x86_64': 'steamy-linux-x86_64',
  'linux-aarch64': 'steamy-linux-arm64',
  'darwin-x86_64': 'steamy-mac-x86_64',
  'darwin-aarch64': 'steamy-mac-arm64',
};

export function getAssetName(): string {
  const key = `${Deno.build.os}-${Deno.build.arch}`;
  const name = ASSET_MAP[key];
  if (!name) {
    throw new SteamyError(
      `Unsupported platform: ${Deno.build.os}/${Deno.build.arch}`,
      'UNSUPPORTED_OS',
    );
  }
  return name;
}

export function isSourceInstall(): boolean {
  try {
    let dir = dirname(Deno.execPath());
    // Walk up to 3 parent dirs: covers bin/, bin/release/, and similar build output layouts
    for (let i = 0; i < 3; i++) {
      try {
        const denoJson = Deno.statSync(join(dir, 'deno.json'));
        const gitDir = Deno.statSync(join(dir, '.git'));
        if (denoJson.isFile && gitDir.isDirectory) return true;
      } catch {
        // Markers not found at this level, continue walking up
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // If we can't read the exec path, assume it's not a source install
  }
  return false;
}

export async function performSelfUpdate(
  release: GitHubRelease,
  logger: Logger,
): Promise<void> {
  const assetName = getAssetName();
  const asset = release.assets.find((a) => a.name === assetName);
  if (!asset) {
    throw new SteamyError(
      `No binary found for ${Deno.build.os}/${Deno.build.arch} in release ${release.tag_name}`,
      'EXTERNAL_DEPENDENCY_ERROR',
    );
  }

  const binaryPath = Deno.execPath();
  const tmpPath = `${binaryPath}.update`;

  logger.info(`Downloading ${release.tag_name}...`);
  const spinner = startSpinner({ text: 'Downloading' });
  try {
    const response = await fetch(asset.browser_download_url);
    if (!response.ok || !response.body) {
      throw new SteamyError(
        `Failed to download update: ${response.statusText}`,
        'EXTERNAL_DEPENDENCY_ERROR',
      );
    }

    const file = await Deno.open(tmpPath, { create: true, write: true });
    try {
      await response.body.pipeTo(file.writable);
    } catch (e) {
      // Clean up temp file on download failure
      try {
        Deno.removeSync(tmpPath);
      } catch { /* ignore */ }
      throw e;
    }
  } finally {
    spinner.stop();
  }

  try {
    await Deno.chmod(tmpPath, 0o755);

    const { success } = await new Deno.Command(tmpPath, {
      args: ['--version'],
      stdout: 'null',
      stderr: 'null',
    }).output();
    if (!success) {
      throw new SteamyError(
        'Downloaded binary failed validation',
        'EXTERNAL_DEPENDENCY_ERROR',
      );
    }

    await Deno.rename(tmpPath, binaryPath);
  } catch (e) {
    try {
      Deno.removeSync(tmpPath);
    } catch { /* ignore */ }
    throw e;
  }
  logger.info(`Updated to ${release.tag_name}!`);
}
