import { assertEquals } from '@std/assert';
import { isNewerVersion, parseSemver } from './version-compare.ts';

Deno.test('parseSemver - parses basic version', () => {
  assertEquals(parseSemver('v1.2.3'), { major: 1, minor: 2, patch: 3 });
});

Deno.test('parseSemver - parses without v prefix', () => {
  assertEquals(parseSemver('1.2.3'), { major: 1, minor: 2, patch: 3 });
});

Deno.test('parseSemver - ignores suffixes like git describe output', () => {
  assertEquals(parseSemver('v0.1.6-1-g07d4545'), {
    major: 0,
    minor: 1,
    patch: 6,
  });
});

Deno.test('parseSemver - returns undefined for invalid input', () => {
  assertEquals(parseSemver('not-a-version'), undefined);
  assertEquals(parseSemver(''), undefined);
});

Deno.test('isNewerVersion - detects newer major', () => {
  assertEquals(isNewerVersion('v0.1.0', 'v1.0.0'), true);
});

Deno.test('isNewerVersion - detects newer minor', () => {
  assertEquals(isNewerVersion('v0.1.0', 'v0.2.0'), true);
});

Deno.test('isNewerVersion - detects newer patch', () => {
  assertEquals(isNewerVersion('v0.1.0', 'v0.1.1'), true);
});

Deno.test('isNewerVersion - returns false for same version', () => {
  assertEquals(isNewerVersion('v0.1.6', 'v0.1.6'), false);
});

Deno.test('isNewerVersion - returns false when current is newer', () => {
  assertEquals(isNewerVersion('v1.0.0', 'v0.9.0'), false);
});

Deno.test('isNewerVersion - handles git describe suffixes', () => {
  assertEquals(isNewerVersion('v0.1.6-1-g07d4545', 'v0.2.0'), true);
  assertEquals(isNewerVersion('v0.1.6-1-g07d4545', 'v0.1.6'), false);
});

Deno.test('isNewerVersion - returns false for invalid input', () => {
  assertEquals(isNewerVersion('invalid', 'v1.0.0'), false);
  assertEquals(isNewerVersion('v1.0.0', 'invalid'), false);
});
