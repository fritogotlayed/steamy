import { assertEquals, assertThrows } from '@std/assert';
import { parseAcf } from './parse-acf.ts';

Deno.test('parseAcf - basic key-value parsing', () => {
  const input = `"key1"\n{\n\t"value1"\t"data1"\n}`;
  const expected = {
    key1: {
      value1: 'data1',
    },
  };
  assertEquals(parseAcf(input), expected);
});

Deno.test('parseAcf - nested structure parsing', () => {
  const input =
    `root\n{\n\tkey1\n\t{\n\t\tvalue1\tdata1\n\t}\n\tkey2\tdata2\n}`;
  const expected = {
    root: {
      key1: {
        value1: 'data1',
      },
      key2: 'data2',
    },
  };
  assertEquals(parseAcf(input), expected);
});

Deno.test('parseAcf - handles quoted values', () => {
  const input = `key1\n{\n\tvalue1\t"quoted data"\n}`;
  const expected = {
    key1: {
      value1: 'quoted data',
    },
  };
  assertEquals(parseAcf(input), expected);
});

Deno.test('parseAcf - handles multiple siblings', () => {
  const input =
    `root\n{\n\tsibling1\n\t{\n\t\tkey1\tvalue1\n\t}\n\tsibling2\n\t{\n\t\tkey2\tvalue2\n\t}\n}`;
  const expected = {
    root: {
      sibling1: {
        key1: 'value1',
      },
      sibling2: {
        key2: 'value2',
      },
    },
  };
  assertEquals(parseAcf(input), expected);
});

Deno.test('parseAcf - throws on invalid input', () => {
  assertThrows(
    () => parseAcf(''),
    Error,
    'Invalid input: body must be a non-empty string',
  );
  assertThrows(
    () => parseAcf(undefined as unknown as string),
    Error,
    'Invalid input: body must be a non-empty string',
  );
});

Deno.test('parseAcf - handles different line endings', () => {
  const inputWindows = 'key1\r\n{\r\n\tvalue1\tdata1\r\n}';
  const inputUnix = 'key1\n{\n\tvalue1\tdata1\n}';
  const expected = {
    key1: {
      value1: 'data1',
    },
  };
  assertEquals(parseAcf(inputWindows), expected);
  assertEquals(parseAcf(inputUnix), expected);
});
