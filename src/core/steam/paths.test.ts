import { assertEquals, assertThrows } from '@std/assert';
import { join } from '@std/path';
import {
  compatDataDir,
  gameCommonDir,
  requireHomeDir,
  steamAppsDir,
  steamRootDir,
} from './paths.ts';
import { stub } from '@std/testing/mock';

Deno.test('requireHomeDir returns HOME when set', () => {
  const s = stub(
    Deno.env,
    'get',
    (key: string) => key === 'HOME' ? '/home/testuser' : undefined,
  );
  try {
    const home = requireHomeDir();
    assertEquals(home, '/home/testuser');
  } finally {
    s.restore();
  }
});

Deno.test('requireHomeDir throws when HOME is not set', () => {
  const s = stub(Deno.env, 'get', () => undefined);
  try {
    assertThrows(
      () => requireHomeDir(),
      Error,
      'HOME environment variable not set',
    );
  } finally {
    s.restore();
  }
});

Deno.test('steamRootDir builds path from HOME', () => {
  const s = stub(
    Deno.env,
    'get',
    (key: string) => key === 'HOME' ? '/home/alice' : undefined,
  );
  try {
    assertEquals(steamRootDir(), join('/home/alice', '.steam', 'steam'));
  } finally {
    s.restore();
  }
});

Deno.test('steamAppsDir returns the Steam apps directory', () => {
  const s = stub(
    Deno.env,
    'get',
    (key: string) => key === 'HOME' ? '/home/bob' : undefined,
  );
  try {
    assertEquals(
      steamAppsDir(),
      join('/home/bob', '.steam', 'steam', 'steamapps'),
    );
  } finally {
    s.restore();
  }
});

Deno.test('compatDataDir builds correct path for given appId', () => {
  const s = stub(
    Deno.env,
    'get',
    (key: string) => key === 'HOME' ? '/home/carol' : undefined,
  );
  try {
    assertEquals(
      compatDataDir('12345'),
      join(
        '/home/carol',
        '.steam',
        'steam',
        'steamapps',
        'compatdata',
        '12345',
      ),
    );
  } finally {
    s.restore();
  }
});

Deno.test('gameCommonDir builds correct path for given folder', () => {
  const s = stub(
    Deno.env,
    'get',
    (key: string) => key === 'HOME' ? '/home/dave' : undefined,
  );
  try {
    assertEquals(
      gameCommonDir('MyGame'),
      join('/home/dave', '.steam', 'steam', 'steamapps', 'common', 'MyGame'),
    );
  } finally {
    s.restore();
  }
});
