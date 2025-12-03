import { join } from '@std/path';

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
