/**
 * Removes a key from a given [section] in an INI file while preserving comments, spacing, line endings, and casing of everything else.
 *
 * @param filePath The path to the INI file to modify.
 * @param section Section to search within. If null/undefined, removes the first matching key outside any section.
 * @param key Key to remove.
 * @param options Optional options.
 * @param options.backupOriginalFile If true, backs up the original file before modifying it. Defaults to false.
 */
export async function removeIniKey(
  filePath: string,
  section: string | null,
  key: string,
  options: {
    backupOriginalFile?: boolean;
  } = {},
): Promise<{ removed: number }> {
  // Read file
  let text = await Deno.readTextFile(filePath);

  // Preserve BOM if present
  const hasBOM = text.charCodeAt(0) === 0xfeff;
  if (hasBOM) text = text.slice(1);

  // Split preserving EOLs (pairs: [line, eol])
  const parts = text.split(/(\r\n|\n|\r)/);
  // parts length is 2*N (+1 if no trailing EOL). We'll process as [line, eol] pairs.

  // Prepare comparisons (case-insensitive key match per INI conventions)
  const keyLower = key.toLowerCase();
  const wantSection = section != null ? section.trim().toLowerCase() : null;

  let inSection: string | null = null;
  let removed = 0;
  const out: string[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    const line = parts[i] ?? '';
    const lineEOL = parts[i + 1] ?? ''; // may be empty for last line

    // Track section headers: [Section Name]
    const secMatch = line.match(/^\s*\[(.*?)]\s*$/);
    if (secMatch) {
      inSection = (secMatch[1] ?? '').trim();
      // Keep the section line as-is
      out.push(line, lineEOL);
      continue;
    }

    // Skip comment-only lines
    if (/^\s*[;#]/.test(line) || line.trim() === '') {
      out.push(line, lineEOL);
      continue;
    }

    // INI key-value line detection: key [=:] value (allow spaces around = or :)
    // We capture original spacing/casing by not rewriting, only compare to decide removal.
    const kv = line.match(/^\s*([^=:#\s][^=:#]*)\s*[:=]/);
    if (kv) {
      const rawKey = kv[1];
      const rawKeyLower = rawKey.trim().toLowerCase();

      const inDesiredSection = wantSection === null
        ? (inSection === null)
        : (inSection?.trim().toLowerCase() === wantSection);

      if (inDesiredSection && rawKeyLower === keyLower) {
        // Drop this line (do not push), effectively removing the key while preserving everything else.
        removed++;
        continue;
      }
    }

    // Default: keep line as-is
    out.push(line, lineEOL);
  }

  if (removed > 0) {
    const finalText = (hasBOM ? '\uFEFF' : '') + out.join('');
    if (options?.backupOriginalFile) {
      await Deno.copyFile(
        filePath,
        filePath + `.bak.${new Date().toISOString()}`,
      );
    }
    await Deno.writeTextFile(filePath, finalText);
  }

  return { removed };
}
