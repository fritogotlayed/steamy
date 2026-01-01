/**
 * Sets or updates a key in a given [section] in an INI file while preserving comments,
 * spacing, line endings, and casing of everything else.
 *
 * If the key exists in the target scope (section or global), its value will be updated
 * in-place while preserving the original key casing, leading whitespace, delimiter
 * (":" or "="), and surrounding spaces. If it does not exist, a new line will be
 * inserted: under the specified section (at the end of that section) or at the end of
 * the file when `section` is null.
 *
 * Notes:
 * - INI is treated in a minimal, surgical manner. We avoid reformatting the file.
 * - Section match is case-insensitive. Key match is case-insensitive.
 * - When inserting a new key, a simple `key=value` form is used.
 *
 * @param filePath Path to the INI file
 * @param section Target section name; use null for the global (no-section) area
 * @param key Key to set/update
 * @param value Value to set (verbatim; not quoted/escaped)
 * @param options Optional configuration
 * @param options.backupOriginalFile If true, saves a timestamped .bak copy before writing
 */
export async function setOrUpdateIniKey(
  filePath: string,
  section: string | null,
  key: string,
  value: string,
  options: { backupOriginalFile?: boolean } = {},
): Promise<{ updated: number; inserted: boolean }> {
  let text = await Deno.readTextFile(filePath);

  // Preserve BOM if present
  const hasBOM = text.charCodeAt(0) === 0xfeff;
  if (hasBOM) text = text.slice(1);

  // Detect original EOL (favor first occurrence)
  let detectedEol = '\n';
  const m = text.match(/\r\n|\n|\r/);
  if (m) detectedEol = m[0];

  // Split preserving EOLs into [line, eol] pairs
  const parts = text.split(/(\r\n|\n|\r)/);

  const keyLower = key.toLowerCase();
  const wantSection = section != null ? section.trim().toLowerCase() : null;

  let inSection: string | null = null;
  let updated = 0;
  let inserted = false;
  const out: string[] = [];

  // For insertion under a section, we need to know where to place the new key.
  // Strategy: buffer lines while inside the desired section; if we reach the
  // next section header without having updated/inserted the key, append a new
  // `key=value` line just before the next section header.
  let bufferingSection = false;
  let sectionBuffer: string[] = [];
  let sectionHasKey = false;

  const flushSectionBuffer = (ensureInserted: boolean) => {
    if (ensureInserted && !sectionHasKey) {
      // Append new key=value within the section using the section's prevailing EOL
      sectionBuffer.push(`${key}=${value}`, detectedEol);
      inserted = true;
    }
    out.push(...sectionBuffer);
    sectionBuffer = [];
    bufferingSection = false;
    sectionHasKey = false;
  };

  for (let i = 0; i < parts.length; i += 2) {
    const line = parts[i] ?? '';
    const lineEOL = parts[i + 1] ?? ''; // may be empty for last line

    // Section header?
    const secMatch = line.match(/^\s*\[(.*?)]\s*$/);
    if (secMatch) {
      // If we were buffering the desired section and we hit a new one, flush and insert if needed
      if (bufferingSection) {
        flushSectionBuffer(true);
      }

      inSection = (secMatch[1] ?? '').trim();

      const nowInDesired = wantSection !== null &&
        inSection.toLowerCase() === wantSection;
      if (nowInDesired) {
        bufferingSection = true;
        sectionBuffer.push(line, lineEOL);
      } else {
        out.push(line, lineEOL);
      }
      continue;
    }

    // If buffering desired section, operate on the buffer; otherwise write-through
    const sink = bufferingSection ? sectionBuffer : out;

    // Comments or blank lines are preserved as-is
    if (/^\s*[;#]/.test(line) || line.trim() === '') {
      sink.push(line, lineEOL);
      continue;
    }

    // Key-value matcher preserving original spacing/delimiter
    // groups: 1=key, 2=delimiter, 3=space after delimiter, 4=value+rest
    const kv = line.match(/^\s*([^=:#\s][^=:#]*)\s*([:=])(\s*)(.*)$/);
    if (kv) {
      const rawKey = kv[1];
      const rawKeyLower = rawKey.trim().toLowerCase();

      const inDesiredScope = wantSection === null
        ? (inSection === null)
        : (inSection?.trim().toLowerCase() === wantSection);

      if (inDesiredScope && rawKeyLower === keyLower) {
        // Update value only; preserve original prefix, delimiter, spacing.
        const updatedLine = line.replace(
          /^(\s*[^=:#\s][^=:#]*\s*[:=]\s*).*/,
          `$1${value}`,
        );
        sink.push(updatedLine, lineEOL);
        updated++;
        sectionHasKey = sectionHasKey || bufferingSection;
        continue;
      }
    }

    sink.push(line, lineEOL);
  }

  // End of file: if we were inside the desired section, ensure insertion
  if (bufferingSection) {
    flushSectionBuffer(true);
  } else if (wantSection === null) {
    // Global (no-section) insertion if key not found
    if (updated === 0) {
      // Ensure file ends with EOL if it had any lines
      const endsWithEol = parts.length > 1 && parts[parts.length - 1] === '';
      if (!endsWithEol && out.length > 0) {
        out.push(detectedEol);
      }
      out.push(`${key}=${value}`);
      // Preserve a trailing EOL if the file had one; otherwise leave as-is
      out.push(detectedEol);
      inserted = true;
    }
  } else {
    // Insertion into a missing section: append section and key at EOF
    if (updated === 0 && !inserted) {
      const needsEol = out.length > 0 && out[out.length - 1] !== detectedEol;
      if (needsEol) out.push(detectedEol);
      out.push(`[${section}]`, detectedEol, `${key}=${value}`, detectedEol);
      inserted = true;
    }
  }

  const finalText = (hasBOM ? '\uFEFF' : '') + out.join('');
  if (options?.backupOriginalFile) {
    await Deno.copyFile(
      filePath,
      filePath + `.bak.${new Date().toISOString()}`,
    );
  }
  await Deno.writeTextFile(filePath, finalText);

  return { updated, inserted };
}
