import { assertEquals } from '@std/assert';
import { stub } from '@std/testing/mock';
import { removeIniKey } from './remove-ini-key.ts';

Deno.test('removeIniKey removes matching key within a section and preserves formatting', async () => {
  const iniBody = [
    '; comment',
    '[Graphics]',
    'Quality = High',
    'VSync=on',
    '',
    '[Audio]',
    'Volume=75',
  ].join('\n') + '\n';

  const readStub = stub(Deno, 'readTextFile', (_: string | URL) => Promise.resolve(iniBody));
  let writtenPath = '';
  let writtenBody = '';
  const writeStub = stub(
    Deno,
    'writeTextFile',
    (
      path: string | URL,
      data: string | ReadableStream<string>,
      _options?: Deno.WriteFileOptions,
    ): Promise<void> => {
      writtenPath = String(path);
      writtenBody = typeof data === 'string' ? data : '[stream]';
      return Promise.resolve();
    },
  );

  try {
    const res = await removeIniKey('/fake/file.ini', 'Graphics', 'VSync');
    assertEquals(res.removed, 1);
    assertEquals(writtenPath, '/fake/file.ini');
    const expected = [
      '; comment',
      '[Graphics]',
      'Quality = High',
      '',
      '[Audio]',
      'Volume=75',
      '', // because original ended with \n, joining preserved final EOL; removal keeps remaining EOLs
    ].join('\n');
    assertEquals(writtenBody, expected);
  } finally {
    readStub.restore();
    writeStub.restore();
  }
});

Deno.test('removeIniKey does not write when key not found', async () => {
  const iniBody = '[Section]\nOther=1\n';
  const readStub = stub(Deno, 'readTextFile', () => Promise.resolve(iniBody));

  let writeCalled = 0;
  const writeStub = stub(Deno, 'writeTextFile', () => {
    writeCalled++;
    return Promise.resolve();
  });

  try {
    const res = await removeIniKey('/fake/file.ini', 'Section', 'Missing');
    assertEquals(res.removed, 0);
    assertEquals(writeCalled, 0);
  } finally {
    readStub.restore();
    writeStub.restore();
  }
});

Deno.test('removeIniKey removes global (no-section) key and preserves BOM', async () => {
  // Include BOM and CRLF EOLs
  const bom = '\uFEFF';
  const iniBodyNoBom = ['User=alice', 'Theme=dark', ''].join('\r\n');
  const iniBody = bom + iniBodyNoBom;

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
    const res = await removeIniKey('/f.ini', null, 'Theme');
    assertEquals(res.removed, 1);
    // Ensure BOM preserved
    if (!written.startsWith('\uFEFF')) {
      throw new Error('BOM not preserved');
    }
    // After removing Theme line, only User remains with original CRLF and trailing EOL
    const withoutBom = written.slice(1);
    assertEquals(withoutBom, ['User=alice', ''].join('\r\n'));
  } finally {
    readStub.restore();
    writeStub.restore();
  }
});

Deno.test('removeIniKey with backupOriginalFile triggers copyFile once when change occurs', async () => {
  const iniBody = '[S]\nKey=1\n';
  const readStub = stub(Deno, 'readTextFile', () => Promise.resolve(iniBody));

  let copied = 0;
  const copyStub = stub(Deno, 'copyFile', (_from: string | URL, _to: string | URL) => {
    copied++;
    return Promise.resolve();
  });
  const writeStub = stub(Deno, 'writeTextFile', () => Promise.resolve());

  try {
    const res = await removeIniKey('/tmp/x.ini', 'S', 'Key', { backupOriginalFile: true });
    assertEquals(res.removed, 1);
    assertEquals(copied, 1);
  } finally {
    readStub.restore();
    copyStub.restore();
    writeStub.restore();
  }
});
