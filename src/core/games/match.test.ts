import { assertEquals, assertRejects } from '@std/assert';
import { findAppIdMatches } from './match.ts';
import { stub } from '@std/testing/mock';
import { SteamyError } from '../errors.ts';

function makeDirEntries(names: string[]): AsyncIterable<Deno.DirEntry> {
  async function* gen() {
    for (const name of names) {
      yield {
        name,
        isFile: true,
        isDirectory: false,
        isSymlink: false,
      } as Deno.DirEntry;
    }
  }
  return { [Symbol.asyncIterator]: gen } as AsyncIterable<Deno.DirEntry>;
}

Deno.test('findAppIdMatches throws on invalid input', async () => {
  await assertRejects(
    () => findAppIdMatches(''),
    Error,
    'Game name must be a non-empty string',
  );
  // Pass an invalid type in a type-safe way to avoid ts-ignore
  await assertRejects(
    () => findAppIdMatches(undefined as unknown as string),
    Error,
    'Game name must be a non-empty string',
  );
});

Deno.test('findAppIdMatches returns matches from .acf files only (case-insensitive)', async () => {
  const envStub = stub(
    Deno.env,
    'get',
    (key: string) => key === 'HOME' ? '/home/test' : undefined,
  );

  const base = '/home/test/.steam/steam/steamapps';
  const dirStub = stub(
    Deno,
    'readDir',
    (path: string | URL): AsyncIterable<Deno.DirEntry> => {
      // ensure function is called with the derived path
      if (String(path) !== base) {
        throw new Error(
          'Unexpected path: ' + String(path),
        );
      }
      return makeDirEntries([
        'appmanifest_123.acf',
        'not-a-cache.txt',
        'appmanifest_456.acf',
        'subdir', // still treated as file entry here, harmless
      ]);
    },
  );

  const files: Record<string, string> = {};
  files[`${base}/appmanifest_123.acf`] =
    `"AppState"\n{\n\t"appid"\t"123"\n\t"name"\t"The Witcher 3"\n}`;
  files[`${base}/appmanifest_456.acf`] =
    `AppState\n{\n\tappid\t456\n\tname\tCyberpunk 2077\n}`;

  const readFileStub = stub(
    Deno,
    'readFile',
    (
      path: string | URL,
      _options?: Deno.ReadFileOptions,
    ): Promise<Uint8Array<ArrayBuffer>> => {
      const p = String(path);
      const body = files[p];
      if (!body) return Promise.reject(new Error('ENOENT mocked'));
      const u8 = new TextEncoder().encode(body);
      // Coerce to expected generic form
      return Promise.resolve(u8 as unknown as Uint8Array<ArrayBuffer>);
    },
  );

  try {
    const res = await findAppIdMatches('witch');
    assertEquals(res, [{ appId: '123', name: 'The Witcher 3' }]);

    const res2 = await findAppIdMatches('CYBER');
    assertEquals(res2, [{ appId: '456', name: 'Cyberpunk 2077' }]);
  } finally {
    readFileStub.restore();
    dirStub.restore();
    envStub.restore();
  }
});

Deno.test('findAppIdMatches returns empty array when no .acf files match', async () => {
  const envStub = stub(
    Deno.env,
    'get',
    (key: string) => key === 'HOME' ? '/home/none' : undefined,
  );
  const _base = '/home/none/.steam/steam/steamapps';
  const dirStub = stub(
    Deno,
    'readDir',
    (_path: string | URL) => makeDirEntries(['appmanifest_1.acf']),
  );
  const readFileStub = stub(
    Deno,
    'readFile',
    (
      _path: string | URL,
      _options?: Deno.ReadFileOptions,
    ): Promise<Uint8Array<ArrayBuffer>> =>
      Promise.resolve(new TextEncoder().encode(
        'AppState\n{\n\tappid\t1\n\tname\tSome Game\n}',
      ) as unknown as Uint8Array<ArrayBuffer>),
  );

  try {
    const res = await findAppIdMatches('Nonexistent');
    assertEquals(res, []);
  } finally {
    readFileStub.restore();
    dirStub.restore();
    envStub.restore();
  }
});

Deno.test('findAppIdMatches wraps readDir errors', async () => {
  const envStub = stub(
    Deno.env,
    'get',
    (key: string) => key === 'HOME' ? '/home/error' : undefined,
  );
  const dirStub = stub(Deno, 'readDir', (_path: string | URL) => {
    throw new Error('permission denied');
  });
  try {
    await assertRejects(
      () => findAppIdMatches('anything'),
      SteamyError,
      'Failed to access Steam directory: permission denied',
    );
  } finally {
    dirStub.restore();
    envStub.restore();
  }
});
