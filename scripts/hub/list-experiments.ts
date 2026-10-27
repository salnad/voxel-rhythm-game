/**
 * Prints the gameplay EXPERIMENTS registry of a checkout as JSON, so the playtest hub can link
 * each experiment. Run with tsx from that checkout:
 * `npx tsx <this> src/experiments/registry.ts`. Prints [] for versions without experiments.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

interface Entry {
  key: string;
  label: string;
  tagline: string;
}

const file = resolve(process.argv[2] ?? 'src/experiments/registry.ts');
let out: Array<{ key: string; label: string; description: string }> = [];
if (existsSync(file)) {
  const mod = (await import(pathToFileURL(file).href)) as { EXPERIMENTS?: readonly Entry[] };
  out = (mod.EXPERIMENTS ?? []).map((e) => ({
    key: e.key,
    label: e.label,
    description: e.tagline,
  }));
}
process.stdout.write(JSON.stringify(out));
