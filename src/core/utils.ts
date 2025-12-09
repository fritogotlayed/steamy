import { join } from '@std/path';
import { SteamyError } from './errors.ts';

export async function dirSize(dir: string) {
  /* Example JS / Node implementation
   * const files = await readdir( directory );
  const stats = files.map( file => stat( path.join( directory, file ) ) );

  return ( await Promise.all( stats ) ).reduce( ( accumulator, { size } ) => accumulator + size, 0 );
   */

  let size = 0;
  const contents = Deno.readDir(dir);
  for await (const entry of contents) {
    if (entry.isDirectory) {
      const subSize = await dirSize(join(dir, entry.name));
      size += subSize;
    } else if (entry.isFile) {
      const stats = await Deno.stat(join(dir, entry.name));
      size += stats.size;
    }
  }
  return size;
}

export function sizeToHumanReadable(size: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  while (size > 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export async function extractWithSystemTar(srcFile: string, destDir: string) {
  await Deno.mkdir(destDir, { recursive: true });
  const cmd = new Deno.Command('tar', {
    args: ['-xzf', srcFile, '-C', destDir],
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const { success, code } = await cmd.output();
  if (!success) {
    throw new SteamyError(
      `tar extraction failed with code ${code}`,
      'EXTERNAL_DEPENDENCY_ERROR',
    );
  }
}

// Checks for an exact process name match via `pgrep -x`
export async function isProcessRunningByName(name: string): Promise<boolean> {
  const cmd = new Deno.Command('pgrep', { args: ['-x', name] });
  try {
    const { code } = await cmd.output();
    return code === 0; // 0 if one or more PIDs matched
  } catch (_) {
    // pgrep not found or other error
    throw new SteamyError(
      `Failed to check for running process with pgrep: '${name}'`,
      'EXTERNAL_DEPENDENCY_ERROR',
    );
  }
}
