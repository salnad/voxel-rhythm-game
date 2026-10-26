/**
 * Prints the MUSIC_MAPPINGS registry of a checkout as JSON, so the playtest hub can link
 * each mapping. Run with tsx from that checkout: `npx tsx <this> src/config/musicMapping.ts`.
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

interface Entry {
  label: string;
  description: string;
}

const file = resolve(process.argv[2] ?? 'src/config/musicMapping.ts');
const mod = (await import(pathToFileURL(file).href)) as { MUSIC_MAPPINGS?: Record<string, Entry> };
const out = Object.entries(mod.MUSIC_MAPPINGS ?? {}).map(([key, m]) => ({
  key,
  label: m.label,
  description: m.description,
}));
process.stdout.write(JSON.stringify(out));
