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
  const result = selectProtonTarball(assets, 'GE-Proton10-34');
  assertEquals(result?.name, 'GE-Proton10-34.tar.gz');
});

Deno.test('selectProtonTarball - returns tarball even if name does not match tag', () => {
  const assets = [
    makeAsset('some-other-name.sha512sum'),
    makeAsset('some-other-name.tar.gz'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton10-34');
  assertEquals(result?.name, 'some-other-name.tar.gz');
});

Deno.test('selectProtonTarball - prefers tag-matching tarball when multiple exist', () => {
  const assets = [
    makeAsset('unrelated.tar.gz'),
    makeAsset('GE-Proton10-34.tar.gz'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton10-34');
  assertEquals(result?.name, 'GE-Proton10-34.tar.gz');
});

Deno.test('selectProtonTarball - returns undefined when no tarballs exist', () => {
  const assets = [
    makeAsset('GE-Proton10-34.sha512sum'),
    makeAsset('GE-Proton10-34.sig'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton10-34');
  assertEquals(result, undefined);
});

Deno.test('selectProtonTarball - returns undefined for empty assets', () => {
  const result = selectProtonTarball([], 'GE-Proton10-34');
  assertEquals(result, undefined);
});

Deno.test('selectProtonTarball - returns undefined when multiple tarballs and none match tag', () => {
  const assets = [
    makeAsset('foo.tar.gz'),
    makeAsset('bar.tar.gz'),
  ];
  const result = selectProtonTarball(assets, 'GE-Proton10-34');
  assertEquals(result, undefined);
});
