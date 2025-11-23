/**
 * @packageDocumentation
 * Utility functions for parsing Steam cache files
 */
import { AcfData } from './types.ts';

/**
 * Converts a Map to an object
 * @param map - The Map to convert
 * @returns Object representation of the Map
 */
function mapToObject(map: Map<string, unknown>): AcfData {
  const obj: AcfData = {};
  for (const [key, value] of map) {
    obj[key] = value instanceof Map ? mapToObject(value) : value as string;
  }
  return obj;
}

const utf8TextDecoder = new TextDecoder('utf-8');
export async function parseSteamCacheFile(filePath: string): Promise<AcfData> {
  if (filePath.endsWith('.acf') || filePath.endsWith('.vdf')) {
    const fileBody = await Deno.readFile(filePath);
    return parseSteamCacheBody(
      utf8TextDecoder.decode(fileBody),
    );
  }
  throw new Error('Unsupported file type');
}

/**
 * Converts a Steam cache body formatted string into an object
 * @param body - The ACF formatted string to parse
 * @returns Parsed object containing ACF fields and values
 * @throws {Error} When input is invalid or parsing fails
 */
export function parseSteamCacheBody(body: string): AcfData {
  if (!body || typeof body !== 'string') {
    throw new Error('Invalid input: body must be a non-empty string');
  }

  const result = new Map<string, unknown>();

  // Remove the quotes from around each attribute
  const unquotedBody = body.replace(/"([^"]+(?="))"/g, '$1');

  // Break each line apart (os new-line independent)
  const lines = unquotedBody.split(/[\r]?\n/g);

  const stack: Map<string, unknown>[] = [];
  let currentKey = '';
  let parent: Map<string, unknown> = new Map();
  let current: Map<string, unknown> = new Map();

  for (let i = 0; i < lines.length - 1; i += 1) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    // Remove tabs
    const escapedLine = line.replace(/\t/g, '');
    const escapedNextLine = nextLine.replace(/\t/g, '');

    if (escapedNextLine === '{') {
      currentKey = escapedLine;

      if (parent.size === 0) {
        parent = result;
        stack.push(parent);
      } else {
        stack.push(current);
        parent = current;
      }
      const newMap = new Map();
      parent.set(currentKey, newMap);
      current = newMap;
    }

    if (
      escapedLine !== '{' &&
      escapedLine !== '}' &&
      escapedLine !== currentKey
    ) {
      const lineElements = line.split(/\t/g).filter((e) => e !== '');
      current.set(lineElements[0], lineElements[1]);
    }

    if (escapedNextLine === '}') {
      current = stack.pop() as Map<string, unknown>;
    }
  }

  return mapToObject(result);
}
