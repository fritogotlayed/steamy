import { assertEquals, assertRejects } from '@std/assert';
import { stub } from '@std/testing/mock';
import { join } from '@std/path';

import {
  getCompatToolMappings,
  getInstalledProtonVersions,
  getProtonMappings,
  getUnusedProtonVersions,
} from './proton.ts';
import { SteamyError } from '../errors.ts';

function makeDirEntries(
  entries: Array<
    {
      name: string;
      isDirectory?: boolean;
      isFile?: boolean;
      isSymlink?: boolean;
    }
  >,
): AsyncIterable<Deno.DirEntry> {
  async function* gen() {
    for (const e of entries) {
      yield {
        name: e.name,
        isFile: e.isFile ?? false,
        isDirectory: e.isDirectory ?? false,
        isSymlink: e.isSymlink ?? false,
      } as Deno.DirEntry;
    }
  }
  return { [Symbol.asyncIterator]: gen } as AsyncIterable<Deno.DirEntry>;
}

Deno.test('getCompatToolMappings returns mapping from config.vdf', async () => {
  const envStub = stub(
    Deno.env,
    'get',
    (key: string) => (key === 'HOME' ? '/home/test' : undefined),
  );

  const configPath = join(
    '/home/test',
    '.steam',
    'steam',
    'config',
    'config.vdf',
  );
  const body = [
    'InstallConfigStore',
    '{',
    '\tSoftware',
    '\t{',
    '\t\tValve',
    '\t\t{',
    '\t\t\tSteam',
    '\t\t\t{',
    '\t\t\t\tCompatToolMapping',
    '\t\t\t\t{',
    '\t\t\t\t\t12345',
    '\t\t\t\t\t{',
    '\t\t\t\t\t\tname\tproton-8.0',
    '\t\t\t\t\t}',
    '\t\t\t\t\t99999',
    '\t\t\t\t\t{',
    '\t\t\t\t\t\tname\tGE-Proton9-2',
    '\t\t\t\t\t}',
    '\t\t\t\t}',
    '\t\t\t}',
    '\t\t}',
    '\t}',
    '}',
  ].join('\n');

  const readTextStub = stub(
    Deno,
    'readTextFile',
    (path: string | URL): Promise<string> => {
      if (String(path) !== configPath) {
        return Promise.reject(new Error('Unexpected path: ' + String(path)));
      }
      return Promise.resolve(body);
    },
  );

  try {
    const map = await getCompatToolMappings();
    assertEquals(map['12345'].name, 'proton-8.0');
    assertEquals(map['99999'].name, 'GE-Proton9-2');
  } finally {
    readTextStub.restore();
    envStub.restore();
  }
});

Deno.test('getProtonMappings aggregates fragments with compat tool versions', async () => {
  const envStub = stub(
    Deno.env,
    'get',
    (key: string) => (key === 'HOME' ? '/home/alice' : undefined),
  );

  // Stub reading the config.vdf used by getCompatToolMappings
  const configPath = join(
    '/home/alice',
    '.steam',
    'steam',
    'config',
    'config.vdf',
  );
  const configBody = [
    'InstallConfigStore',
    '{',
    '\tSoftware',
    '\t{',
    '\t\tValve',
    '\t\t{',
    '\t\t\tSteam',
    '\t\t\t{',
    '\t\t\t\tCompatToolMapping',
    '\t\t\t\t{',
    '\t\t\t\t\t111',
    '\t\t\t\t\t{',
    '\t\t\t\t\t\tname\tProton-8.0',
    '\t\t\t\t\t}',
    '\t\t\t\t}',
    '\t\t\t}',
    '\t\t}',
    '\t}',
    '}',
  ].join('\n');

  const readTextStub = stub(
    Deno,
    'readTextFile',
    (path: string | URL): Promise<string> => {
      if (String(path) === configPath) return Promise.resolve(configBody);
      return Promise.reject(
        new Error('Unexpected readTextFile: ' + String(path)),
      );
    },
  );

  // Prepare two .acf files in steamapps directory
  const appsDir = join('/home/alice', '.steam', 'steam', 'steamapps');
  const dirStub = stub(
    Deno,
    'readDir',
    (path: string | URL): AsyncIterable<Deno.DirEntry> => {
      if (String(path) !== appsDir) {
        throw new Error('Unexpected readDir path: ' + String(path));
      }
      return makeDirEntries([
        { name: 'appmanifest_111.acf', isFile: true },
        { name: 'appmanifest_222.acf', isFile: true },
        { name: 'notes.txt', isFile: true },
      ]);
    },
  );

  const files: Record<string, string> = {};
  files[join(appsDir, 'appmanifest_111.acf')] = [
    'AppState',
    '{',
    '\tappid\t111',
    '\tname\tCool Game',
    '}',
  ].join('\n');
  files[join(appsDir, 'appmanifest_222.acf')] = [
    'AppState',
    '{',
    '\tappid\t222',
    '\tname\tOther Game',
    '}',
  ].join('\n');

  const readFileStub = stub(
    Deno,
    'readFile',
    (path: string | URL): Promise<Uint8Array<ArrayBuffer>> => {
      const body = files[String(path)];
      if (!body) return Promise.reject(new Error('ENOENT: ' + String(path)));
      return Promise.resolve(
        new TextEncoder().encode(body) as unknown as Uint8Array<ArrayBuffer>,
      );
    },
  );

  try {
    const mappings = await getProtonMappings();
    // Sort by appid for deterministic comparison
    const sorted = [...mappings].sort((a, b) => a.appid.localeCompare(b.appid));
    // Expect two entries; one with mapped version, one with N/A
    assertEquals(sorted, [
      { appid: '111', name: 'Cool Game', protonVersion: 'Proton-8.0' },
      { appid: '222', name: 'Other Game', protonVersion: 'N/A' },
    ]);
  } finally {
    readFileStub.restore();
    dirStub.restore();
    readTextStub.restore();
    envStub.restore();
  }
});

Deno.test('getProtonMappings wraps errors as SteamyError', async () => {
  const envStub = stub(
    Deno.env,
    'get',
    (key: string) => (key === 'HOME' ? '/home/bad' : undefined),
  );
  const configPath = join(
    '/home/bad',
    '.steam',
    'steam',
    'config',
    'config.vdf',
  );
  const readTextStub = stub(
    Deno,
    'readTextFile',
    (path: string | URL): Promise<string> => {
      if (String(path) === configPath) return Promise.reject(new Error('boom'));
      return Promise.reject(new Error('Unexpected path'));
    },
  );

  try {
    await assertRejects(
      () => getProtonMappings(),
      SteamyError,
      'Failed to access Steam directory: boom',
    );
  } finally {
    readTextStub.restore();
    envStub.restore();
  }
});

Deno.test('getInstalledProtonVersions lists directories, ignores defaults, and honors overrides', async () => {
  const dirPath = '/virtual/proton-prefix';
  const dirStub = stub(
    Deno,
    'readDir',
    (path: string | URL): AsyncIterable<Deno.DirEntry> => {
      if (String(path) !== dirPath) {
        throw new Error('Unexpected path: ' + String(path));
      }
      return makeDirEntries([
        { name: 'Proton-9.0', isDirectory: true },
        { name: 'LegacyRuntime', isDirectory: true },
        { name: 'not-a-dir.txt', isFile: true },
      ]);
    },
  );

  try {
    // Default ignore should filter out LegacyRuntime
    const setDefault = await getInstalledProtonVersions({ rootDir: dirPath });
    assertEquals(Array.from(setDefault).sort(), ['Proton-9.0']);

    // Custom ignore overrides default
    const setCustom = await getInstalledProtonVersions({
      rootDir: dirPath,
      ignoreVersions: [],
    });
    assertEquals(Array.from(setCustom).sort(), ['LegacyRuntime', 'Proton-9.0']);
  } finally {
    dirStub.restore();
  }
});

Deno.test('getUnusedProtonVersions identifies versions not referenced by mappings', () => {
  const mappings = [
    { appid: '1', name: 'A', protonVersion: 'Proton-8.0' },
  ];
  const installed = ['Proton-7.0', 'Proton-8.0'];
  const unused = getUnusedProtonVersions(mappings, installed);
  assertEquals(unused, ['Proton-7.0']);
});
