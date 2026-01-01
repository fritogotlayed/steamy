import { assertEquals } from '@std/assert';
import { stub } from '@std/testing/mock';
import { setOrUpdateIniKey } from './set-ini-key.ts';

Deno.test('setOrUpdateIniKey updates existing key preserving delimiter and spacing', async () => {
  const iniBody = [
    '[Video]',
    'Resolution :  1920x1080',
    'VSync=off',
    '',
  ].join('\n');

  const readStub = stub(Deno, 'readTextFile', () => Promise.resolve(iniBody));
  let written = '';
  const writeStub = stub(Deno, 'writeTextFile', (
    _: string | URL,
    data: string | ReadableStream<string>,
    _options?: Deno.WriteFileOptions,
  ) => {
    written = typeof data === 'string' ? data : '[stream]';
    return Promise.resolve();
  });

  try {
    const res = await setOrUpdateIniKey('/fake.ini', 'Video', 'Resolution', '1280x720');
    assertEquals(res.updated, 1);
    assertEquals(res.inserted, false);
    const expected = [
      '[Video]',
      'Resolution :  1280x720', // spacing and delimiter preserved
      'VSync=off',
      '',
    ].join('\n');
    assertEquals(written, expected);
  } finally {
    readStub.restore();
    writeStub.restore();
  }
});

Deno.test('setOrUpdateIniKey inserts key at the end of existing section when missing', async () => {
  const iniBody = [
    '; header',
    '[Gameplay]',
    'Difficulty=Hard',
    '',
    '[Other]',
    'Foo=Bar',
    '',
  ].join('\n');

  const readStub = stub(Deno, 'readTextFile', () => Promise.resolve(iniBody));
  let written = '';
  const writeStub = stub(Deno, 'writeTextFile', (
    _: string | URL,
    data: string | ReadableStream<string>,
  ) => {
    written = typeof data === 'string' ? data : '[stream]';
    return Promise.resolve();
  });

  try {
    const res = await setOrUpdateIniKey('/f.ini', 'Gameplay', 'AutoSave', 'true');
    assertEquals(res.updated, 0);
    assertEquals(res.inserted, true);
    const expected = [
      '; header',
      '[Gameplay]',
      'Difficulty=Hard',
      '',
      'AutoSave=true',
      '[Other]',
      'Foo=Bar',
      '',
    ].join('\n');
    assertEquals(written, expected);
  } finally {
    readStub.restore();
    writeStub.restore();
  }
});

Deno.test('setOrUpdateIniKey inserts into global scope with original EOL and trailing EOL', async () => {
  const iniBody = ['Name=Game', ''].join('\r\n'); // CRLF with trailing EOL
  const readStub = stub(Deno, 'readTextFile', () => Promise.resolve(iniBody));
  let written = '';
  const writeStub = stub(Deno, 'writeTextFile', (
    _: string | URL,
    data: string | ReadableStream<string>,
  ) => {
    written = typeof data === 'string' ? data : '[stream]';
    return Promise.resolve();
  });

  try {
    const res = await setOrUpdateIniKey('/f.ini', null, 'Version', '1');
    assertEquals(res.updated, 0);
    assertEquals(res.inserted, true);
    assertEquals(written, ['Name=Game', 'Version=1', ''].join('\r\n'));
  } finally {
    readStub.restore();
    writeStub.restore();
  }
});

Deno.test('setOrUpdateIniKey appends new section and key when section missing', async () => {
  const iniBody = '[A]\nX=1\n';
  const readStub = stub(Deno, 'readTextFile', () => Promise.resolve(iniBody));
  let written = '';
  const writeStub = stub(Deno, 'writeTextFile', (
    _: string | URL,
    data: string | ReadableStream<string>,
  ) => {
    written = typeof data === 'string' ? data : '[stream]';
    return Promise.resolve();
  });

  try {
    const res = await setOrUpdateIniKey('/f.ini', 'B', 'Y', '2');
    assertEquals(res.updated, 0);
    assertEquals(res.inserted, true);
    // Implementation adds a separating blank line before appending new section
    assertEquals(written, ['[A]', 'X=1', '', '[B]', 'Y=2', ''].join('\n'));
  } finally {
    readStub.restore();
    writeStub.restore();
  }
});

Deno.test('setOrUpdateIniKey preserves BOM and triggers backup when writing', async () => {
  const bom = '\uFEFF';
  const iniBody = bom + '[S]\nK=old\n';
  const readStub = stub(Deno, 'readTextFile', () => Promise.resolve(iniBody));
  let copied = 0;
  const copyStub = stub(Deno, 'copyFile', () => {
    copied++;
    return Promise.resolve();
  });
  let written = '';
  const writeStub = stub(Deno, 'writeTextFile', (
    _: string | URL,
    data: string | ReadableStream<string>,
    _options?: Deno.WriteFileOptions,
  ) => {
    written = typeof data === 'string' ? data : '[stream]';
    return Promise.resolve();
  });

  try {
    const res = await setOrUpdateIniKey('/f.ini', 'S', 'K', 'new', { backupOriginalFile: true });
    assertEquals(res.updated, 1);
    assertEquals(res.inserted, false);
    if (!written.startsWith('\uFEFF')) {
      throw new Error('BOM not preserved');
    }
    assertEquals(copied, 1);
  } finally {
    readStub.restore();
    copyStub.restore();
    writeStub.restore();
  }
});
