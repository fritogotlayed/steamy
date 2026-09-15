import { assertEquals } from '@std/assert';
import { selectProtonTarball } from './asset-selection.ts';
import type { GitHubReleaseAsset } from './types.ts';

const makeAsset = (name: string): GitHubReleaseAsset => ({
  name,
  content_type: 'application/octet-stream',
  browser_download_url: `https://example.com/${name}`,
  size: 100,
});

Deno.test('selectProtonTarball - returns the single tarball among mixed assets', () => {
  const assets = [
    makeAsset('GE-Proton10-34.sha512sum'),
    makeAsset('GE-Proton10-34.tar.gz'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton10-34', 'x86_64');
  assertEquals(result?.name, 'GE-Proton10-34.tar.gz');
});

Deno.test('selectProtonTarball - returns tarball even if name does not match tag', () => {
  const assets = [
    makeAsset('some-other-name.sha512sum'),
    makeAsset('some-other-name.tar.gz'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton10-34', 'x86_64');
  assertEquals(result?.name, 'some-other-name.tar.gz');
});

Deno.test('selectProtonTarball - prefers tag-matching tarball when multiple exist', () => {
  const assets = [
    makeAsset('unrelated.tar.gz'),
    makeAsset('GE-Proton10-34.tar.gz'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton10-34', 'x86_64');
  assertEquals(result?.name, 'GE-Proton10-34.tar.gz');
});

Deno.test('selectProtonTarball - returns undefined when no tarballs exist', () => {
  const assets = [
    makeAsset('GE-Proton10-34.sha512sum'),
    makeAsset('GE-Proton10-34.sig'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton10-34', 'x86_64');
  assertEquals(result, undefined);
});

Deno.test('selectProtonTarball - returns undefined for empty assets', () => {
  const result = selectProtonTarball([], 'GE-Proton10-34', 'x86_64');
  assertEquals(result, undefined);
});

Deno.test('selectProtonTarball - returns undefined when multiple tarballs and none match tag', () => {
  const assets = [
    makeAsset('foo.tar.gz'),
    makeAsset('bar.tar.gz'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton10-34', 'x86_64');
  assertEquals(result, undefined);
});

// GE-Proton11-4 onward: every build carries an explicit architecture suffix.
const perArchAssets = [
  makeAsset('GE-Proton11-6-aarch64.sha512sum'),
  makeAsset('GE-Proton11-6-aarch64.tar.gz'),
  makeAsset('GE-Proton11-6-x86_64.sha512sum'),
  makeAsset('GE-Proton11-6-x86_64.tar.gz'),
];

Deno.test('selectProtonTarball - picks the x86_64 build from per-arch assets', () => {
  const result = selectProtonTarball(perArchAssets, 'GE-Proton11-6', 'x86_64');
  assertEquals(result?.name, 'GE-Proton11-6-x86_64.tar.gz');
});

Deno.test('selectProtonTarball - picks the aarch64 build from per-arch assets', () => {
  const result = selectProtonTarball(perArchAssets, 'GE-Proton11-6', 'aarch64');
  assertEquals(result?.name, 'GE-Proton11-6-aarch64.tar.gz');
});

Deno.test('selectProtonTarball - returns undefined when no build matches the arch', () => {
  const result = selectProtonTarball(perArchAssets, 'GE-Proton11-6', 'riscv64');
  assertEquals(result, undefined);
});

Deno.test('selectProtonTarball - matches arch suffix when the tag prefix differs', () => {
  const assets = [
    makeAsset('proton-ge-aarch64.tar.gz'),
    makeAsset('proton-ge-x86_64.tar.gz'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton11-6', 'x86_64');
  assertEquals(result?.name, 'proton-ge-x86_64.tar.gz');
});

// GE-Proton11-3: the x86_64 build is named after the tag alone, while aarch64
// carries an explicit suffix.
const hybridAssets = [
  makeAsset('GE-Proton11-3-aarch64.tar.gz'),
  makeAsset('GE-Proton11-3.sha512sum'),
  makeAsset('GE-Proton11-3.tar.gz'),
];

Deno.test('selectProtonTarball - falls back to the bare tag for x86_64 in hybrid releases', () => {
  const result = selectProtonTarball(hybridAssets, 'GE-Proton11-3', 'x86_64');
  assertEquals(result?.name, 'GE-Proton11-3.tar.gz');
});

Deno.test('selectProtonTarball - picks the suffixed build for aarch64 in hybrid releases', () => {
  const result = selectProtonTarball(hybridAssets, 'GE-Proton11-3', 'aarch64');
  assertEquals(result?.name, 'GE-Proton11-3-aarch64.tar.gz');
});

Deno.test('selectProtonTarball - does not hand a non-x86_64 arch the bare tag build', () => {
  const assets = [
    makeAsset('GE-Proton11-3-aarch64.tar.gz'),
    makeAsset('GE-Proton11-3.tar.gz'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton11-3', 'riscv64');
  assertEquals(result, undefined);
});

Deno.test('selectProtonTarball - ignores a lone arch-suffixed build for another arch', () => {
  const assets = [makeAsset('GE-Proton11-6-aarch64.tar.gz')];
  const result = selectProtonTarball(assets, 'GE-Proton11-6', 'x86_64');
  assertEquals(result, undefined);
});
